// LAND-1A · Un día con ORNO. Copy CONGELADO (blueprint v1.2 §6, verbatim).

export const DAY_FLOW = {
  eyebrow: "La rutina real",
  title: "Un día con ORNO",
  steps: [
    {
      time: "Mañana",
      title: "Revisas las citas del día antes de abrir.",
      imgHint: "Dueño revisando la agenda en una tablet, mostrador de barbería, mañana",
    },
    {
      time: "Durante el día",
      title: "Cada barbero sabe a quién atiende y a qué hora.",
      imgHint: "Barbero cortando cabello a un cliente sentado en silla de barbería",
    },
    {
      time: "Después de cada servicio",
      title: "Registras cobro, cliente y movimiento.",
      imgHint: "Cobro en caja o POS después de un servicio, celular mostrando confirmación",
    },
    {
      time: "Al cierre",
      title: "Ves cuánto generó la barbería y qué preparar para mañana.",
      imgHint: "Detalle de herramientas de barbero — tijeras, máquina, peine — al final del día",
    },
  ],
} as const
