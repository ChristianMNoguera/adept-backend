// Entrada de la Lambda de la API: reutiliza el handler de services/conversational-agent/src/lambda.ts.
// Está acá (dentro de infra/) porque CDK exige que el archivo de entrada esté bajo la raíz del
// proyecto de infraestructura, que es la carpeta donde está instalado esbuild.

export { handler } from "../../../services/conversational-agent/src/lambda";
