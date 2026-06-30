# Plan de Ejecución para Salida a Ingresos

## Objetivo

Lanzar una versión funcional y cobrada del producto con riesgo controlado, pasando por una fase de estabilización técnica y una fase de piloto comercial.

## Estado actual (verificado 2026-06-30)

> Esta sección reemplaza la versión anterior (22-05-2026), que hacía referencia a una ruta de entorno local específica (`/home/luisr/dev/...`) y a un estado de lint que ya no es preciso. Verificado directamente contra el código y los scripts del proyecto en esta fecha.

| Chequeo | Resultado |
|---|---|
| `pnpm lint` | ✅ Sin errores — solo warnings (variables sin usar, `<img>` sin optimizar, un `console.log` no permitido) |
| `pnpm type-check` | 🔴 **2 errores reales** — ver detalle abajo |
| Seguridad (`SECURITY-REPORT.md`) | 7/10 — rotación de secrets pendiente y vencida (ver `docs/SECRET-ROTATION.md`) |
| Facturación (`/admin/billing`) | 🔴 Stub sin backend — no se puede cobrar nada con esto |
| Integraciones (`/admin/integrations`) | 🟡 UI sin conexiones reales a terceros |
| RLS en Supabase | Definido en 31 scripts SQL; **no verificado en runtime** contra una instancia real |

**Errores de `type-check` pendientes:**
1. `app/admin/page.tsx:134` — `Property 'catch' does not exist on type 'PromiseLike<void>'`
2. `components/admin/appointments/appointment-modal.tsx:47` — `Type 'string | undefined' is not assignable to type 'string'`

**Bloqueador principal actualizado:** ya no es deuda de lint (resuelta), sino: (1) los 2 errores de type-check arriba, (2) la rotación de secrets vencida, y (3) que el sistema de cobro real (`/admin/billing`) no existe — es un requisito para la Fase 2 de este mismo plan (monetización) y hoy es 100% mock.

## Estrategia por fases

### Fase 0 — Estabilización técnica

Objetivo: eliminar errores que rompen el flujo de negocio.

Checklist de salida:
- [ ] Corregir los 2 errores de `pnpm type-check` listados arriba
- [x] Lint sin errores bloqueantes (verificado 2026-06-30)
- [ ] Rotar los secrets expuestos (`docs/SECRET-ROTATION.md`) — bloqueante para cualquier despliegue público
- [ ] Variables de entorno validadas con `pnpm validate-env`
- [ ] Flujo E2E mínimo verde:
  - Reserva pública (`/reservar`)
  - Login cliente
  - Cancelación/reprogramación de cita

Criterio go/no-go: Go solo si los 2 errores de type-check están resueltos, los secrets están rotados, y los 3 flujos E2E pasan.

### Fase 1 — Piloto cerrado (3-7 días)

Objetivo: probar con una barbería real, sin cobrar todavía (la facturación no existe — ver Fase 2).

Alcance: 1 barbería, 1-2 empleados, ventana limitada de turnos.

Checklist:
- [ ] Registro de eventos de reserva y cancelación
- [ ] Confirmación de notificaciones por email/WhatsApp (la integración de Resend/Twilio existe en código — confirmar que funciona end-to-end con secrets rotados)
- [ ] Respaldo manual diario de citas (no hay backup automatizado documentado)
- [ ] Protocolo de rollback definido
- [ ] Confirmar que el rol asignado al dueño/staff sea `admin` o `employee` (no usar `manager` ni `barber` — son deuda técnica, ver `docs/manuales/manual-sistema.md §6`)

KPI mínimos: tasa de reserva completada ≥ 70% · tasa de fallo técnico < 5% · tiempo de respuesta en soporte < 15 min.

### Fase 2 — Monetización inicial (semanas 2-4)

Objetivo: cobrar de forma repetible.

🔴 **Bloqueador no resuelto:** `/admin/billing` es hoy una pantalla de demostración sin ningún backend de pagos conectado (ver `docs/manuales/manual-admin.md §12`). Antes de esta fase es necesario **decidir e implementar un proveedor de pagos real** (ninguno está integrado en el código actual — ni Stripe ni Mercado Pago, pese a estar listados en `/admin/integrations` como "disponibles").

Modelo sugerido (sin cambios respecto al plan original):
- Plan mensual base + límite de reservas
- Onboarding asistido
- Soporte por WhatsApp en horario comercial

Checklist:
- [ ] Implementar backend de cobro real (Stripe, Mercado Pago u otro) — no existe hoy
- [ ] Página de pricing publicada
- [ ] Proceso de cobro y comprobante definido
- [ ] Política simple de reembolso
- [ ] Embudo de conversión medido

KPI mínimos: 3 clientes pagos · churn mensual < 20% · CAC recuperado ≤ 1 mes.

## Priorización técnica inmediata

1. Corregir los 2 errores de `pnpm type-check` (ver Estado actual arriba)
2. Rotar secrets expuestos (`docs/SECRET-ROTATION.md`) — vencido
3. Decidir el destino de `/admin/billing`: implementarlo con un proveedor real, ocultarlo, o marcarlo "Próximamente" — no puede quedar como está si se va a cobrar
4. Verificar RLS contra una instancia real de Supabase antes de manejar datos de un cliente real

## Comandos de control de avance

```bash
pnpm security:supply-chain
pnpm lint
pnpm type-check
pnpm test:e2e
pnpm validate-env
```

## Definición de éxito para iniciar pruebas reales

- Cero errores en `pnpm type-check`
- Secrets rotados y `pnpm validate-env` sin errores
- E2E de negocio en verde
- Plan de soporte y rollback operativo
- `/admin/billing` no es necesario para el piloto cerrado (Fase 1, sin cobro), pero **sí es bloqueante para la Fase 2**

## Riesgos actuales

- Rotación de secrets vencida — riesgo de seguridad activo, no solo técnico
- Dependencia de una instancia real de Supabase para producción, no verificada en runtime
- `/admin/billing` e `/admin/integrations` pueden generar expectativas falsas si se muestran a un cliente sin aclarar que son demostraciones
- Riesgo de desviar foco hacia funciones no monetizables (ej. completar Integraciones) antes de resolver el bloqueador real de cobro

## Decisión recomendada

No abrir pruebas reales masivas todavía. Ejecutar Fase 0 (con los 2 errores de type-check y la rotación de secrets como bloqueantes concretos, no genéricos), luego lanzar el piloto cerrado de Fase 1 sin expectativa de cobro, y no avanzar a Fase 2 hasta tener un proveedor de pagos real conectado a `/admin/billing`.
