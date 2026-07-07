# Tareas: `rotate-secrets`

> Basado en la propuesta (`proposal.md`) y el procedimiento documentado en `docs/SECRET-ROTATION.md`.

---

## Fase 1: Generación de Nuevos Secrets

- [x] Generar nueva API Key en Resend Dashboard (~2026-06-30)
- [x] Resetear Auth Token en Twilio Console (~2026-06-30)
- [x] Generar nuevo CRON_SECRET con `openssl rand -hex 32` (~2026-06-30)

---

## Fase 2: Actualización de Entornos

- [x] Actualizar `RESEND_API_KEY` en Vercel (producción) (~2026-06-30)
- [x] Actualizar `TWILIO_AUTH_TOKEN` en Vercel (producción) (~2026-06-30)
- [x] Actualizar `CRON_SECRET` en Vercel (producción) (~2026-06-30)
- [x] Actualizar `.env.local` en entornos de desarrollo (laptop personal del usuario + esta máquina) (~2026-06-30)
- [x] Limpiar `.env.example` — reemplazar valores reales por placeholders (commit `1fa6145`, 2026-06-30)
- [x] Eliminar secrets en texto plano de `SECURITY-REPORT.md` (auditoría documental 2026-06-30)
- [x] Corregir `scripts/validate-env.js` — eliminar secrets hardcodeados (commit `1fa6145`, 2026-06-30)

---

## Fase 3: Validación

- [x] Ejecutar `pnpm validate-env` — confirmar que los 3 secrets pasan validación (2026-07-07) ✅
- [ ] Ejecutar suite E2E (`pnpm test:e2e`) contra producción — validar flujos de booking/notificaciones (no ejecutado aún, requiere Supabase credentials)
- [x] Verificación manual en producción — confirmar envío de emails/WhatsApp (según reporte del usuario, funciona end-to-end)
- [ ] Verificar que los secrets viejos fueron revocados en los dashboards de Resend/Twilio (recomendado en `docs/SECRET-ROTATION.md` pero no confirmado como ejecutado)

---

## Documentación

- [x] Actualizar `docs/SECRET-ROTATION.md` — reflejar rotación completada (2026-07-07)
- [x] Actualizar `docs/GO-LIVE-PLAN.md` — marcar rotación como resuelta en bloqueadores/checklist (2026-07-07)
- [x] Actualizar `SECURITY-REPORT.md` — score, vulnerabilidades, checklists, recomendaciones (2026-07-07)
- [x] Actualizar `project-brain/01_CURRENT_STATE.md` — prioridades (2026-07-07)
- [x] Actualizar `project-brain/05_ROADMAP.md` — M0 milestone y priorities (2026-07-07)
- [x] Actualizar `project-brain/07_TECH_DEBT.md` — critical section (2026-07-07)
- [x] Añadir entrada en `project-brain/08_CHANGELOG.md` (2026-07-07)

---

## Notas

- Rotación ejecutada ~2026-06-30 (acciones manuales externas a git: dashboards de Resend/Twilio + Vercel env vars)
- Documentación completada 2026-07-07
- Supabase keys (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) NO forman parte de este change — nunca estuvieron expuestos y no fueron rotados
- Historial de git: los valores viejos quedan en commits anteriores a `1fa6145` (2026-06-30) — purgar historial fue excluido del alcance por diseño
