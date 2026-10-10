// Usuarios de prueba en Cognito (solo para desarrollo).
// Usa las credenciales del perfil de AWS configurado en tu máquina.
//
// Uso (desde la carpeta infra/):
//   node scripts/test-users.mjs create   -> crea un paciente y un profesional de prueba (con su perfil
//                                           en CoreTable; el consentimiento no se toca)
//   node scripts/test-users.mjs tokens   -> imprime un token de acceso de cada uno (solo por pantalla)
//
// Variables de entorno necesarias:
//   USER_POOL_ID         (salida UserPoolId de la infraestructura)
//   TEST_CLIENT_ID       (salida TestClientId: el cliente "adept-dev-test")
//   TEST_USER_PASSWORD   (contraseña de los usuarios de prueba; mínimo 8 caracteres, con minúsculas y números)
//   CORE_TABLE           (solo para "create": salida CoreTableName, la tabla donde se guardan los perfiles)
//   AWS_REGION           (opcional, por defecto sa-east-1)

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

// Usuarios ficticios (correos de ejemplo).
const USUARIOS = [
  { email: "paciente.prueba@example.com", role: "patient", group: "patients" },
  { email: "profesional.prueba@example.com", role: "professional", group: "professionals" },
];

// Lee una variable de entorno obligatoria o termina con un mensaje claro.
function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`Falta la variable de entorno ${nombre}. Mirá infra/README.md.`);
    process.exit(1);
  }
  return valor;
}

const region = process.env.AWS_REGION || "sa-east-1";
const client = new CognitoIdentityProviderClient({ region });
const dynamo = new DynamoDBClient({ region });

// Guarda el perfil en CoreTable, igual que la Lambda de post-confirmación (los usuarios creados
// por un administrador no pasan por ella). No pisa un perfil que ya existe.
async function guardarPerfil(userPoolId, coreTable, { email, role }) {
  // El userId es el "sub" de Cognito (el mismo que viaja en el token).
  const usuario = await client.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }));
  const userId = usuario.UserAttributes.find((a) => a.Name === "sub").Value;

  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: coreTable,
        Item: {
          pk: { S: `USER#${userId}` },
          sk: { S: "PROFILE" },
          userId: { S: userId },
          role: { S: role },
          username: { S: email.split("@")[0] },
          email: { S: email },
          createdAt: { S: new Date().toISOString() },
        },
        ConditionExpression: "attribute_not_exists(pk)",
      })
    );
    console.log("  perfil: guardado");
  } catch (err) {
    if (err.name !== "ConditionalCheckFailedException") throw err;
    console.log("  perfil: ya existía (no se modifica)");
  }
}

// Crea (o actualiza) un usuario, le fija la contraseña permanente y lo agrega a su grupo.
async function crearUsuario(userPoolId, coreTable, password, { email, role, group }) {
  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: "SUPPRESS", // no manda correo de invitación
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "custom:role", Value: role },
        ],
      })
    );
    console.log(`Creado: ${email}`);
  } catch (err) {
    if (err.name !== "UsernameExistsException") throw err;
    console.log(`Ya existía: ${email} (se actualiza la contraseña y el grupo)`);
  }

  // Contraseña permanente (así no pide cambiarla en el primer inicio de sesión).
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );

  // Al ser creado por un administrador, la Lambda de post-confirmación no corre: se asigna el grupo acá.
  await client.send(
    new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: email, GroupName: group })
  );
  console.log(`  grupo: ${group}`);

  await guardarPerfil(userPoolId, coreTable, { email, role });
}

// Inicia sesión como administrador y devuelve el token de acceso.
async function obtenerToken(userPoolId, clientId, password, email) {
  const res = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
  );
  return res.AuthenticationResult.AccessToken;
}

async function main() {
  const comando = process.argv[2];
  const userPoolId = requerida("USER_POOL_ID");
  const password = requerida("TEST_USER_PASSWORD");

  if (comando === "create") {
    const coreTable = requerida("CORE_TABLE");
    for (const usuario of USUARIOS) await crearUsuario(userPoolId, coreTable, password, usuario);
    console.log("Listo. Ahora podés pedir los tokens con: node scripts/test-users.mjs tokens");
  } else if (comando === "tokens") {
    const clientId = requerida("TEST_CLIENT_ID");
    // Los tokens se imprimen solo por pantalla (no se guardan en ningún archivo).
    for (const usuario of USUARIOS) {
      const token = await obtenerToken(userPoolId, clientId, password, usuario.email);
      const variable = usuario.role === "patient" ? "AUTH_TOKEN_PATIENT" : "AUTH_TOKEN_PROFESSIONAL";
      console.log(`\n# ${usuario.role} (${usuario.email}). Para usarlo en PowerShell:`);
      console.log(`$env:${variable} = "${token}"`);
    }
    console.log("\nLos tokens de acceso duran 1 hora; después hay que pedirlos de nuevo.");
  } else {
    console.error("Uso: node scripts/test-users.mjs create | tokens");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.name}: ${err.message}`);
  process.exit(1);
});
