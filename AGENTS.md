# 🤖 AGENTS.md — Instrucciones para Agentes de IA

Este archivo guía a los agentes de IA para ser productivos y seguros en el proyecto **Barber Manager**.

---

## 📚 Documentación Clave

- [README.md](README.md) — Descripción general, instalación, estructura y comandos principales.
- [docs/README.md](docs/README.md) — Índice de seguridad y enlaces a documentación técnica.
- [docs/QUICK-START-SECURITY.md](docs/QUICK-START-SECURITY.md) — Guía rápida de seguridad.
- [docs/SECURITY-IMPLEMENTATION.md](docs/SECURITY-IMPLEMENTATION.md) — Detalles técnicos de seguridad.
- [docs/SECURITY-CHECKLIST.md](docs/SECURITY-CHECKLIST.md) — Checklist de seguridad para desarrollo y despliegue.
- [docs/SECRET-ROTATION.md](docs/SECRET-ROTATION.md) — Guía de rotación de secrets.
- [SECURITY-REPORT.md](SECURITY-REPORT.md) — Análisis de seguridad y plan de remediación.

---

## 🏗️ Comandos Esenciales

> El proyecto usa `pnpm` (ver `package.json`), no `npm`.

- `pnpm dev` — Servidor de desarrollo
- `pnpm build` — Build de producción
- `pnpm start` — Servidor de producción
- `pnpm lint` — Linter
- `pnpm type-check` — Verificación de tipos
- `pnpm format` — Formateo de código
- `pnpm validate-env` — Validación de variables de entorno
- `pnpm security-check` — Chequeo de seguridad
- `pnpm setup-hooks` — Configuración de git hooks
- `pnpm predeploy` — Checklist pre-deployment

---

## 🗂️ Estructura del Proyecto

- `app/` — Rutas y páginas Next.js (App Router)
- `components/` — Componentes reutilizables (UI, auth, dashboard, layout)
- `lib/` — Utilidades, configuración, estado global y tipos
- `scripts/` — Scripts SQL y utilidades de base de datos
- `middleware.ts` — Middleware global de Next.js

---

## 🔒 Seguridad y Buenas Prácticas

- Hay 31 scripts SQL en `scripts/` que definen políticas de Row Level Security (RLS) — su aplicación efectiva no fue verificada en runtime contra una instancia real (ver `SECURITY-REPORT.md`)
- `middleware.ts` aplica gating por rol cuando hay sesión de Supabase; en modo demo (sin Supabase configurado) el middleware hace pass-through y el control de acceso es solo client-side
- Validar siempre variables de entorno antes de deploy (`pnpm validate-env`)
- Revisar y rotar secrets antes de producción — la rotación está vencida desde el 27/02/2026, ver `docs/SECRET-ROTATION.md`
- 🔴 `scripts/validate-env.js` tiene los 3 secrets comprometidos hardcodeados en texto plano (código funcional, no documentación) — ver advertencia en `docs/SECRET-ROTATION.md`
- Seguir los checklists de seguridad y pre-deployment
- Usar los scripts de seguridad antes de cada release

---

## ⚠️ Convenciones y Pitfalls

- El entorno depende de Supabase: revisa credenciales y ejecuta scripts SQL en orden
- El código fuente está en TypeScript y usa App Router de Next.js 15
- UI basada en Tailwind CSS y shadcn/ui
- Estado global con Zustand
- Formularios con React Hook Form
- Despliegue recomendado en Vercel

---

## 🚦 Flujo recomendado para agentes

1. Leer `README.md` y `docs/README.md` para contexto general y seguridad
2. Validar entorno (`pnpm validate-env`)
3. Ejecutar chequeos de seguridad (`pnpm security-check`)
4. Seguir los checklists antes de merge/deploy
5. Documentar cambios relevantes en seguridad

---

## 📝 Notas para agentes

- No dupliques documentación: enlaza a los archivos fuente
- Si detectas una convención nueva, documenta aquí y enlaza
- Si el proyecto crece, sugiere dividir instrucciones por área (frontend, backend, seguridad)

---

> Última actualización: 2026-06-30
