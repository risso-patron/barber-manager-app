// LAND-1B · Audiencias (#como — cierra el bloque "Cómo funciona" junto a
// "Un día con ORNO"). Copy CONGELADO (blueprint v1.2 §8, verbatim; todos los
// puntos verificados como reales en el Product Readiness Report 2026-07-10).

export const AUDIENCES = {
  title: "Para el dueño, para el equipo, para el cliente",
  cards: [
    {
      title: "Dueño",
      imgHint: "Dueño de barbería revisando ingresos en laptop, ambiente cálido",
      points: ["Ve ingresos.", "Controla la agenda.", "Supervisa al equipo.", "Toma mejores decisiones."],
    },
    {
      title: "Empleado",
      imgHint: "Equipo de barberos trabajando juntos, ambiente boutique moderno",
      points: ["Conoce sus citas.", "Evita confusiones.", "Trabaja con más orden."],
    },
    {
      title: "Cliente",
      imgHint: "Cliente esperando su turno o entrando a la barbería, ambiente acogedor",
      points: ["Recibe mejor atención.", "Menos esperas.", "Historial más claro.", "Experiencia más profesional."],
    },
  ],
} as const
