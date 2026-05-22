# Plan de Ejecucion para Salida a Ingresos

## Objetivo
Lanzar una version funcional y cobrada del producto con riesgo controlado, pasando por una fase de estabilizacion tecnica y una fase de piloto comercial.

## Estado actual (22-05-2026)
- Supply chain: aprobado (defensa en capas activa).
- Entorno WSL: estable en /home/luisr/dev/barber-manager-app.
- Bloqueador principal: deuda de calidad en frontend y hooks (lint con muchos errores) que afecta confiabilidad para pruebas reales.

## Estrategia por fases

### Fase 0 - Estabilizacion tecnica (48-72h)
Objetivo: eliminar errores que rompen flujo de negocio.

Checklist de salida:
- Lint sin errores en rutas de negocio criticas:
  - app/reservar
  - app/auth/login
  - app/auth/register
  - app/client
  - app/admin/appointments
- Type-check sin errores.
- Variables de entorno validadas en local con script de entorno.
- Flujo E2E minimo verde:
  - Reserva publica
  - Login cliente
  - Cancelacion/reprogramacion de cita

Criterio go/no-go:
- Go solo si rutas criticas no muestran errores y los 3 flujos E2E pasan.

### Fase 1 - Piloto cerrado (3-7 dias)
Objetivo: probar dinero real con bajo riesgo.

Alcance:
- 1 barberia
- 1-2 empleados
- Ventana limitada de turnos

Checklist:
- Registro de eventos de reserva y cancelacion
- Confirmacion de notificaciones (email/whatsapp)
- Respaldo manual diario de citas
- Protocolo de rollback definido

KPI minimos:
- Tasa de reserva completada >= 70%
- Tasa de fallo tecnico < 5%
- Tiempo de respuesta en soporte < 15 min

### Fase 2 - Monetizacion inicial (semanas 2-4)
Objetivo: cobrar de forma repetible.

Modelo sugerido:
- Plan mensual base + limite de reservas
- Onboarding asistido
- Soporte por WhatsApp en horario comercial

Checklist:
- Pagina de pricing publicada
- Proceso de cobro y comprobante definido
- Politica simple de reembolso
- Embudo de conversion medido

KPI minimos:
- 3 clientes pagos
- Churn mensual < 20%
- CAC recuperado <= 1 mes

## Priorizacion tecnica inmediata (hoy/manana)
1. Corregir rutas que hoy mas impactan ingresos:
- Login/Register
- Reserva publica
- Cliente (mis citas)

2. Corregir errores severos recurrentes:
- no-explicit-any en modulos de negocio
- react-hooks/rules-of-hooks
- eqeqeq

3. Dejar baseline de calidad automatica:
- pnpm run security:supply-chain
- pnpm run lint
- pnpm run type-check
- pnpm run test:e2e

## Comandos de control de avance
Ejecutar en /home/luisr/dev/barber-manager-app:
- pnpm run security:supply-chain
- pnpm run lint
- pnpm run type-check
- pnpm run test:e2e

## Definicion de exito para iniciar pruebas reales
- Cero errores en flujos criticos.
- E2E de negocio en verde.
- Entorno con variables validadas.
- Plan de soporte y rollback operativo.

## Riesgos actuales
- Deuda de lint/hook en varias paginas administrativas y de cliente.
- Dependencia de entorno para Supabase en auth/reserva.
- Riesgo de desviar foco hacia funciones no monetizables antes de estabilizar el core de reserva.

## Decision recomendada
No abrir pruebas reales masivas aun. Ejecutar Fase 0 y luego lanzar piloto cerrado con objetivo comercial claro.
