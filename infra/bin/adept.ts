// Punto de entrada de CDK: crea la aplicación y el stack de desarrollo.

import * as cdk from "aws-cdk-lib";
import { AdeptDevStack } from "../lib/adept-dev-stack";

const app = new cdk.App();

new AdeptDevStack(app, "AdeptDevStack", {
  // La región es fija; la cuenta la completa CDK con la del perfil de AWS en uso.
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "sa-east-1" },
});

// Etiquetas que se aplican a todos los recursos.
cdk.Tags.of(app).add("project", "adept");
cdk.Tags.of(app).add("env", "dev");
