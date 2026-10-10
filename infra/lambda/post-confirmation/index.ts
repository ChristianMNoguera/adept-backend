// Se ejecuta en Cognito después de que el usuario confirma su registro. Hace dos cosas:
//   1. Lee el atributo custom:role y agrega al usuario al grupo "professionals" o "patients".
//   2. Guarda el perfil del usuario en CoreTable (pk=USER#<userId>, sk=PROFILE).
// Si cualquiera de las dos falla, el error se propaga (así no quedan usuarios sin grupo ni sin
// perfil sin que nadie lo note).

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, PutItemCommand, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

const cognito = new CognitoIdentityProviderClient({});
const dynamo = new DynamoDBClient({});

export const handler = async (event: any) => {
  // Solo al confirmar el registro (este disparador también corre al recuperar la contraseña).
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") return event;

  // "professional" va al grupo professionals; cualquier otro valor (o ninguno) va a patients.
  const attrs = event.request.userAttributes;
  const esProfesional = attrs["custom:role"] === "professional";

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: event.userPoolId,
      Username: event.userName,
      GroupName: esProfesional ? "professionals" : "patients",
    })
  );

  // El userId es el "sub" de Cognito: el mismo que viaja en el token de acceso.
  const userId = attrs.sub as string;
  const email = attrs.email as string;
  // El grupo de usuarios solo tiene correo y rol: el nombre visible es lo que va antes de la "@".
  const username = email.split("@")[0];

  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: process.env.CORE_TABLE,
        Item: {
          pk: { S: `USER#${userId}` },
          sk: { S: "PROFILE" },
          userId: { S: userId },
          role: { S: esProfesional ? "professional" : "patient" },
          username: { S: username },
          email: { S: email },
          createdAt: { S: new Date().toISOString() },
        },
        // No pisa un perfil que ya existe.
        ConditionExpression: "attribute_not_exists(pk)",
      })
    );
  } catch (err) {
    // Que el perfil ya exista no es un error; cualquier otra falla sí.
    if (!(err instanceof ConditionalCheckFailedException)) throw err;
  }

  // Cognito exige devolver el mismo evento.
  return event;
};
