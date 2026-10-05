# infra — ADEPT en AWS

Infraestructura como código con **AWS CDK en TypeScript**. Un solo stack, `AdeptDevStack`, en la región `sa-east-1` (São Paulo). Crea:

- **Cognito**: grupo de usuarios (registro por correo), grupos `patients` y `professionals`, y tres clientes: `adept-mobile`, `adept-web` y `adept-dev-test` (este último solo para pruebas).
- **Lambda** con la API de `services/conversational-agent` (con datos todavía fijos/mock) detrás de un **API Gateway tipo HTTP**.
- Una **Lambda** chica que, al confirmar el registro de un usuario, lo agrega al grupo que eligió (paciente o profesional).

Todo se borra con `cdk destroy`. No usa VPC ni NAT Gateway ni nada que cobre por hora; el API Gateway tiene un límite de 20 solicitudes por segundo (ráfaga de 40) para proteger el costo.

## Antes de empezar

- **Node.js 20 o superior** (recomendado 22). CDK ya no da soporte a Node 18.
- **AWS CLI** instalada (para `aws configure`).
- Una cuenta de AWS y un usuario de IAM con permisos de administración y sus claves de acceso.
- Instalar las dependencias, una vez, en las dos carpetas (la Lambda se empaqueta con lo que hay en ambas):

```powershell
cd services\conversational-agent
npm install
cd ..\..\infra
npm install
```

Los comandos de abajo se corren desde la carpeta `infra\` (salvo que diga otra cosa).

## 1. Configurar un perfil de AWS

```powershell
aws configure --profile adept
$env:AWS_PROFILE = "adept"
```

`aws configure` pregunta tu Access Key ID, tu Secret Access Key, la región (poné `sa-east-1`) y el formato de salida (`json`). Las claves quedan en tu máquina (`~\.aws\`), nunca en el repo. La segunda línea hace que esta ventana de PowerShell use ese perfil; hay que repetirla si abrís otra ventana.

## 2. Preparar la cuenta (una sola vez por cuenta y región)

```powershell
npx cdk bootstrap
```

Crea en `sa-east-1` un bucket y unos roles que CDK necesita para subir el código. Tarda un par de minutos y se hace una sola vez. Espera un mensaje final de `Environment ... bootstrapped`.

## 3. Ver qué se va a crear

```powershell
npx cdk diff
```

Muestra los recursos nuevos y los permisos de IAM que se van a crear, sin tocar nada. La primera vez todo aparece como nuevo (`[+]`).

## 4. Desplegar

```powershell
npx cdk deploy
```

Crea todo en AWS. Va a mostrar los cambios de seguridad (permisos de IAM) y pedir confirmación: respondé `y`. Tarda unos minutos. Al final imprime las **salidas** (outputs).

## 5. Leer las salidas

Salen impresas al terminar el `deploy`. Para volver a verlas más tarde:

```powershell
aws cloudformation describe-stacks --stack-name AdeptDevStack --region sa-east-1 --query "Stacks[0].Outputs" --output table
```

| Salida | Para qué sirve |
|---|---|
| `ApiUrl` | URL base de la API (se la pasás al frontend) |
| `UserPoolId` | Identificador del grupo de usuarios de Cognito |
| `MobileClientId` | Cliente de Cognito de la app móvil |
| `WebClientId` | Cliente de Cognito del panel web |
| `Region` | `sa-east-1` |
| `TestClientId` | Cliente solo para pruebas (no va al frontend) |

Ninguna de estas salidas es secreta, pero tampoco las subas a archivos del repo si no hace falta.

## 6. Crear usuarios de prueba y obtener tokens

Crea un paciente (`paciente.prueba@example.com`) y un profesional (`profesional.prueba@example.com`) con correos ficticios. La contraseña la elegís vos y no se escribe en ningún archivo (mínimo 8 caracteres, con minúsculas y números).

```powershell
$env:USER_POOL_ID = "<salida UserPoolId>"
$env:TEST_CLIENT_ID = "<salida TestClientId>"
$env:TEST_USER_PASSWORD = Read-Host "Contraseña de prueba"
node scripts\test-users.mjs create
node scripts\test-users.mjs tokens
```

- `create` crea los dos usuarios y los agrega a su grupo. Si ya existen, solo les actualiza la contraseña. Espera `Creado: ...` y `grupo: ...`.
- `tokens` imprime, **solo por pantalla**, una línea `$env:AUTH_TOKEN_PATIENT = "..."` y otra `$env:AUTH_TOKEN_PROFESSIONAL = "..."`. Copialas y pegalas en PowerShell. Los tokens duran 1 hora; después hay que pedirlos de nuevo.

## 7. Probar la API desplegada

Con los tokens ya cargados en la ventana de PowerShell:

```powershell
cd ..\services\conversational-agent
$env:BASE_URL = "<salida ApiUrl>"
npm run smoke
```

Recorre las 25 operaciones del contrato contra la URL real, con tokens de Cognito en vez de los headers de prueba. Espera `25/25 operaciones ok`.

## 8. Borrar todo

```powershell
cd ..\..\infra
npx cdk destroy
```

Borra el stack completo (Cognito con sus usuarios, las Lambdas, la API y los logs). Pide confirmación: respondé `y`. El bucket y los roles de `cdk bootstrap` quedan en la cuenta (cuestan centavos o nada y se reutilizan).

## Configuración opcional

- **CORS**: por defecto la API acepta cualquier origen (`*`), cómodo para desarrollo. Para limitarlo al panel web: `npx cdk deploy -c corsOrigins=https://mi-panel.ejemplo.com` (varios orígenes, separados por comas).
- **Scripts de npm**: `npm run build` (revisa los tipos), `synth`, `diff`, `deploy` y `destroy` hacen lo mismo que los `npx cdk ...` de arriba. `npx cdk synth` genera la plantilla de CloudFormation en `cdk.out\` sin necesitar credenciales.

## Cosas a tener en cuenta

- Cognito manda los códigos de verificación por correo con su remitente por defecto, que tiene un **límite diario bajo** (alcanza para desarrollo).
- El rol (paciente o profesional) lo elige la persona al registrarse. Ser profesional no da acceso a datos de ningún paciente sin su aprobación (ADR-0010).
- La Lambda de la API se empaqueta con esbuild; el contrato `contracts/openapi.yaml` viaja dentro del paquete como `/var/task/openapi.yaml`.
