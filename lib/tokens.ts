// ORNO UI Framework · M0
// Typed token constants for code that cannot consume CSS variables
// (canvas charts, email templates, PDF generation, third-party libs).
// For components, ALWAYS prefer Tailwind semantic classes.

export const tokens = {
  surface: {
    bg: "#FAF9F7",
    bg2: "#F4F2EE",
    card: "#FFFFFF",
    border: "#E8E4DE",
    borderSoft: "#F4F2EE",
  },
  sage: {
    50: "#F3F8F5",
    100: "#EAF2ED",
    500: "#5F9F77",
    600: "#4C8862",
    700: "#3E7354",
  },
  ink: {
    900: "#26231F",
    600: "#57534B",
    400: "#8A847A", // large text only
    300: "#B5AFA5",
  },
  accents: {
    terracotta: { base: "#C57B57", tint: "#F6EBE4", text: "#9A5A3B" },
    beige: { base: "#CBB595", tint: "#F7F3EB", text: "#8F7A52" },
    dustyblue: { base: "#7E9BB4", tint: "#EAEFF4", text: "#4A6B87" },
    lavender: { base: "#A79CC0", tint: "#EFEAF6", text: "#6D5F91" },
  },
  semantic: {
    success: { base: "#4E8A64", tint: "#EAF2ED", text: "#3E7354" },
    warning: { base: "#B98A2E", tint: "#F7EFDD", text: "#8F6A1F" },
    danger: { base: "#C24E42", tint: "#FBF3F2", text: "#A93F34" },
  },
  /** Brand red — Ornō wordmark and brand moments ONLY. */
  brand: "#E53935",
  radius: { control: 14, card: 20, modal: 24, pill: 999 },
  shadow: {
    raised: "0 1px 2px rgba(38,35,31,.04), 0 4px 16px rgba(38,35,31,.05)",
    overlay: "0 16px 48px rgba(38,35,31,.14)",
  },
  motion: {
    curve: "cubic-bezier(0.2, 0, 0, 1)",
    micro: 120,
    enter: 200,
    scene: 250,
  },
  chart: ["#5F9F77", "#C57B57", "#7E9BB4", "#CBB595", "#A79CC0"],
} as const

export type OrnoTokens = typeof tokens
