// Se ejecuta en Cognito después de que el usuario confirma su registro.
// Lee el atributo custom:role y lo agrega al grupo "professionals" o "patients".

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  // Solo al confirmar el registro (este disparador también corre al recuperar la contraseña).
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") return event;

  // "professional" va al grupo professionals; cualquier otro valor (o ninguno) va a patients.
  const role = event.request.userAttributes["custom:role"];
  const group = role === "professional" ? "professionals" : "patients";

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: event.userPoolId,
      Username: event.userName,
      GroupName: group,
    })
  );

  // Cognito exige devolver el mismo evento.
  return event;
};
