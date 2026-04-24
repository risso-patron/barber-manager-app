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

- `npm run dev` — Servidor de desarrollo
- `npm run build` — Build de producción
- `npm run start` — Servidor de producción
- `npm run lint` — Linter
- `npm run type-check` — Verificación de tipos
- `npm run format` — Formateo de código
- `npm run validate-env` — Validación de variables de entorno
- `npm run security-check` — Chequeo de seguridad
- `npm run setup-hooks` — Configuración de git hooks
- `npm run predeploy` — Checklist pre-deployment

---

## 🗂️ Estructura del Proyecto

- `app/` — Rutas y páginas Next.js (App Router)
- `components/` — Componentes reutilizables (UI, auth, dashboard, layout)
- `lib/` — Utilidades, configuración, estado global y tipos
- `scripts/` — Scripts SQL y utilidades de base de datos
- `middleware.ts` — Middleware global de Next.js

---

## 🔒 Seguridad y Buenas Prácticas

- Todas las tablas de base de datos usan Row Level Security (RLS)
- Validar siempre variables de entorno antes de deploy
- Revisar y rotar secrets antes de producción
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
2. Validar entorno (`npm run validate-env`)
3. Ejecutar chequeos de seguridad (`npm run security-check`)
4. Seguir los checklists antes de merge/deploy
5. Documentar cambios relevantes en seguridad

---

## 📝 Notas para agentes

- No dupliques documentación: enlaza a los archivos fuente
- Si detectas una convención nueva, documenta aquí y enlaza
- Si el proyecto crece, sugiere dividir instrucciones por área (frontend, backend, seguridad)

---

> Última actualización: 2026-04-20
