// Saludo inicial de una sesión. Sale de plantillas (no usa LLM) y nunca incluye el nombre del
// usuario ni otros datos personales (RNF12).

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

type Momento = "dia" | "tarde" | "noche";

// Hora (0 a 23) en Buenos Aires para un instante dado.
export function horaEnBuenosAires(ahora: Date): number {
  const texto = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(ahora);
  return parseInt(texto, 10);
}

// Buenos días hasta las 11:59, buenas tardes de 12:00 a 19:59 y buenas noches el resto.
export function momentoDelDia(ahora: Date): Momento {
  const hora = horaEnBuenosAires(ahora);
  if (hora < 12) return "dia";
  if (hora < 20) return "tarde";
  return "noche";
}

// Dos redacciones por cada caso (primera sesión / sesión posterior).
const PLANTILLAS: Record<Momento, { primera: string[]; posterior: string[] }> = {
  dia: {
    primera: [
      "Buenos días. Soy ADEPT, estoy para charlar con vos cuando quieras. ¿Cómo amaneciste hoy?",
      "Buen día. Es un gusto conocerte. Podemos conversar de lo que tengas ganas. ¿Cómo estás esta mañana?",
    ],
    posterior: [
      "Buenos días, qué bueno verte de nuevo. ¿Cómo amaneciste hoy?",
      "Buen día. Me alegra que estés acá otra vez. ¿Cómo va tu mañana?",
    ],
  },
  tarde: {
    primera: [
      "Buenas tardes. Soy ADEPT, estoy para charlar con vos cuando quieras. ¿Cómo venís hoy?",
      "Buenas tardes. Es un gusto conocerte. Podemos conversar de lo que tengas ganas. ¿Cómo estás esta tarde?",
    ],
    posterior: [
      "Buenas tardes, qué bueno verte de nuevo. ¿Cómo viene tu día?",
      "Buenas tardes. Me alegra que estés acá otra vez. ¿Cómo va tu tarde?",
    ],
  },
  noche: {
    primera: [
      "Buenas noches. Soy ADEPT, estoy para charlar con vos cuando quieras. ¿Cómo estuvo tu día?",
      "Buenas noches. Es un gusto conocerte. Podemos conversar de lo que tengas ganas. ¿Cómo estás esta noche?",
    ],
    posterior: [
      "Buenas noches, qué bueno verte de nuevo. ¿Cómo estuvo tu día?",
      "Buenas noches. Me alegra que estés acá otra vez. ¿Cómo te fue hoy?",
    ],
  },
};

// Número fijo (0 o 1) calculado a partir del sessionId: la misma sesión siempre elige la misma redacción.
export function variantePara(sessionId: string): number {
  let suma = 0;
  for (const caracter of sessionId) suma += caracter.charCodeAt(0);
  return suma % 2;
}

export function buildGreeting(opciones: { sessionId: string; ahora: Date; primeraSesion: boolean }): string {
  const grupo = PLANTILLAS[momentoDelDia(opciones.ahora)];
  const lista = opciones.primeraSesion ? grupo.primera : grupo.posterior;
  return lista[variantePara(opciones.sessionId)];
}
