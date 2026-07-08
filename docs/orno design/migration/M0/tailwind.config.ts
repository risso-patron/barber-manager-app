import type { Config } from "tailwindcss";

// ORNO UI Framework · M0 tokens
// Semantic colors come from CSS variables in globals.css (shadcn convention).
// The named scales below (sage, ink, accents…) are the Constitution palette
// for cases where a semantic token doesn't fit. Never use raw hex in components.

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* ── ORNO Constitution palette ─────────────────────────── */
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
          400: "#8A847A", // large text only (AA)
          300: "#B5AFA5",
        },
        terracotta: { DEFAULT: "#C57B57", tint: "#F6EBE4", text: "#9A5A3B" },
        beige: { DEFAULT: "#CBB595", tint: "#F7F3EB" },
        dustyblue: { DEFAULT: "#7E9BB4", tint: "#EAEFF4", text: "#4A6B87" },
        lavender: { DEFAULT: "#A79CC0", tint: "#EFEAF6", text: "#6D5F91" },
        success: { DEFAULT: "#4E8A64", tint: "#EAF2ED", text: "#3E7354" },
        warning: { DEFAULT: "#B98A2E", tint: "#F7EFDD", text: "#8F6A1F" },
        danger: { DEFAULT: "#C24E42", tint: "#FBF3F2", text: "#A93F34" },
        /* Brand red — logo/brand moments ONLY. Never interface, never errors. */
        brand: "#E53935",
        surface: { DEFAULT: "#FAF9F7", 2: "#F4F2EE" },
      },
      borderRadius: {
        lg: "var(--radius)", // 14px — buttons & inputs
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "1.25rem",  // 20px — cards
        modal: "1.5rem",  // 24px — modals & sheets
      },
      boxShadow: {
        resting: "none",
        raised: "0 1px 2px rgba(38,35,31,.04), 0 4px 16px rgba(38,35,31,.05)",
        overlay: "0 16px 48px rgba(38,35,31,.14)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      transitionTimingFunction: {
        orno: "cubic-bezier(0.2, 0, 0, 1)",
      },
      transitionDuration: {
        micro: "120ms",
        enter: "200ms",
        scene: "250ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 200ms cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};
export default config;
