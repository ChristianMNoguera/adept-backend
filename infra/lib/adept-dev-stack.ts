// Stack de desarrollo de ADEPT: Cognito + DynamoDB + Lambda con la API (modo híbrido) + API Gateway.
// Todo se borra con "cdk destroy" y no hay recursos que cobren por hora.

import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class AdeptDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Grupo de logs de una Lambda: retención de 1 semana y se borra con el stack.
    const logGroup = (name: string) =>
      new logs.LogGroup(this, name, {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

    // ---------------------------------------------------------------
    // DynamoDB (ADR-0014). Pago por uso, cifrado en reposo por defecto, sin recuperación a un
    // punto en el tiempo, y se borran con "cdk destroy".
    // ---------------------------------------------------------------

    // Usuarios, consentimiento y metadatos de sesiones.
    const coreTable = new dynamodb.Table(this, "CoreTable", {
      tableName: "adept-dev-core",
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // gsi1: sesiones de un usuario ordenadas por fecha de inicio.
    coreTable.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    // gsi2: sesiones activas ordenadas por última actividad. Es un índice disperso: solo tiene
    // ítems mientras la sesión está activa (al cerrarla se le quitan gsi2pk y gsi2sk).
    coreTable.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Texto de los mensajes: temporal. DynamoDB borra los ítems cuando vence "expiresAt" (TTL).
    const textTable = new dynamodb.Table(this, "TextTable", {
      tableName: "adept-dev-text",
      partitionKey: { name: "sessionId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "seq", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ---------------------------------------------------------------
    // Cognito
    // ---------------------------------------------------------------

    // Lambda que, al confirmar el registro, asigna el grupo (patients / professionals)
    // y guarda el perfil del usuario en CoreTable.
    const postConfirmationFn = new NodejsFunction(this, "PostConfirmationFn", {
      entry: path.join(__dirname, "../lambda/post-confirmation/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      logGroup: logGroup("PostConfirmationLogs"),
      environment: { CORE_TABLE: coreTable.tableName },
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "adept-dev",
      // Registro propio, con inicio de sesión por correo y verificación con código.
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      userVerification: { emailStyle: cognito.VerificationEmailStyle.CODE },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OFF,
      // Remitente de correo por defecto de Cognito (tiene un límite diario bajo; alcanza para desarrollo).
      email: cognito.UserPoolEmail.withCognito(),
      // Contraseñas simples a propósito (adultos mayores): 8+ caracteres, minúsculas y números.
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      // Atributo "role" (custom:role): la app lo envía al registrarse y no se puede cambiar después.
      customAttributes: { role: new cognito.StringAttribute({ mutable: false }) },
      lambdaTriggers: { postConfirmation: postConfirmationFn },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Permiso mínimo de la Lambda de post-confirmación: solo agregar usuarios a grupos.
    // Se da sobre "cualquier user pool de esta cuenta y región" y no sobre el ARN de este pool:
    // si no, el pool y la Lambda se necesitarían entre sí (dependencia circular en CloudFormation).
    postConfirmationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminAddUserToGroup"],
        resources: [this.formatArn({ service: "cognito-idp", resource: "userpool", resourceName: "*" })],
      })
    );

    // Permiso mínimo para guardar el perfil: solo PutItem y solo sobre CoreTable.
    postConfirmationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [coreTable.tableArn],
      })
    );

    // Grupos: de ellos sale el rol de la API.
    new cognito.CfnUserPoolGroup(this, "PatientsGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "patients",
    });
    new cognito.CfnUserPoolGroup(this, "ProfessionalsGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "professionals",
    });

    // Qué atributos puede leer y escribir una app (el correo y el rol elegido al registrarse).
    const writeAttributes = new cognito.ClientAttributes()
      .withStandardAttributes({ email: true })
      .withCustomAttributes("role");
    const readAttributes = new cognito.ClientAttributes()
      .withStandardAttributes({ email: true, emailVerified: true })
      .withCustomAttributes("role");

    // Clientes de las apps: sin secreto, con SRP (la contraseña no viaja) y renovación de token.
    const appClient = (clientId: string, name: string) =>
      userPool.addClient(clientId, {
        userPoolClientName: name,
        generateSecret: false,
        authFlows: { userSrp: true },
        readAttributes,
        writeAttributes,
      });
    const mobileClient = appClient("MobileClient", "adept-mobile");
    const webClient = appClient("WebClient", "adept-web");

    // Cliente solo para pruebas: usuario y contraseña desde un administrador (exige credenciales
    // de AWS para usarse, por eso la app no lo conoce).
    const testClient = userPool.addClient("DevTestClient", {
      userPoolClientName: "adept-dev-test",
      generateSecret: false,
      authFlows: { adminUserPassword: true },
    });

    // ---------------------------------------------------------------
    // API: Lambda con la app Express + API Gateway tipo HTTP
    // ---------------------------------------------------------------

    const apiFn = new NodejsFunction(this, "ApiFn", {
      // Reexporta el handler de services/conversational-agent/src/lambda.ts (ver ese archivo).
      entry: path.join(__dirname, "../lambda/api/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      logGroup: logGroup("ApiLogs"),
      environment: {
        AUTH_MODE: "cognito",
        // hybrid: las operaciones con lógica real usan DynamoDB y el resto sigue en mock (ADR-0014).
        DATA_SOURCE: "hybrid",
        CORE_TABLE: coreTable.tableName,
        TEXT_TABLE: textTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        // Clientes móvil y web, más el de pruebas (adept-dev-test): se incluye solo en el stack de
        // desarrollo porque los tokens de prueba (scripts/test-users.mjs) salen de ese cliente.
        COGNITO_CLIENT_IDS: `${mobileClient.userPoolClientId},${webClient.userPoolClientId},${testClient.userPoolClientId}`,
        // "*" en desarrollo; se cambia con: cdk deploy -c corsOrigins=https://mi-panel.example
        CORS_ORIGINS: this.node.tryGetContext("corsOrigins") ?? "*",
        // El contrato viaja dentro del paquete (ver commandHooks).
        OPENAPI_SPEC_PATH: "/var/task/openapi.yaml",
      },
      bundling: {
        target: "node22",
        // Copia contracts/openapi.yaml dentro del paquete. inputDir es la carpeta infra/
        // (ver projectRoot más abajo), por eso el contrato está un nivel arriba.
        // Se usa node para que el comando funcione igual en Windows y en Linux.
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string) => [
            `node -e "require('fs').copyFileSync(process.argv[1], process.argv[2])" "${inputDir}/../contracts/openapi.yaml" "${outputDir}/openapi.yaml"`,
          ],
        },
      },
      // El empaquetado usa el esbuild instalado en infra/ (por eso la raíz del proyecto es esta carpeta).
      depsLockFilePath: path.join(__dirname, "../package-lock.json"),
    });

    // Permisos mínimos y explícitos de la API sobre las tablas y los índices de CoreTable.
    // Sin Scan, y sin "grantReadWriteData" (que daría más acciones de las necesarias).
    apiFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:BatchWriteItem",
        ],
        resources: [
          coreTable.tableArn,
          `${coreTable.tableArn}/index/gsi1`,
          `${coreTable.tableArn}/index/gsi2`,
          textTable.tableArn,
        ],
      })
    );

    // Todo el tráfico va a la Lambda. CORS no se configura acá: lo resuelve la app Express.
    const httpApi = new apigw.HttpApi(this, "HttpApi", {
      apiName: "adept-dev",
      createDefaultStage: false,
      defaultIntegration: new HttpLambdaIntegration("ApiIntegration", apiFn),
    });

    // Etapa por defecto con límite de tráfico (protege el costo): 20 por segundo, ráfaga de 40.
    new apigw.HttpStage(this, "DefaultStage", {
      httpApi,
      stageName: "$default",
      autoDeploy: true,
      throttle: { rateLimit: 20, burstLimit: 40 },
    });

    // ---------------------------------------------------------------
    // Salidas: datos que se le pasan al frontend
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "MobileClientId", { value: mobileClient.userPoolClientId });
    new cdk.CfnOutput(this, "WebClientId", { value: webClient.userPoolClientId });
    new cdk.CfnOutput(this, "Region", { value: this.region });
    // Solo para el script de usuarios de prueba (no va al frontend).
    new cdk.CfnOutput(this, "TestClientId", { value: testClient.userPoolClientId });
    new cdk.CfnOutput(this, "CoreTableName", { value: coreTable.tableName });
    new cdk.CfnOutput(this, "TextTableName", { value: textTable.tableName });
  }
}
