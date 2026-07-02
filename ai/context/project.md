# ORNÓ

## Project Context

Versión: 1.0

Última actualización:
2026-07-01

---

# Descripción

Ornó es una plataforma SaaS (Software as a Service) diseñada para la gestión integral de barberías y salones de belleza.

Su objetivo es digitalizar completamente la operación del negocio, ofreciendo una experiencia moderna tanto para clientes como para empleados y administradores.

Ornó no es solamente un sistema de reservas.

Es un ecosistema completo para administrar un negocio de servicios.

---

# Visión

Convertirse en la plataforma líder para barberías y salones en Latinoamérica, ofreciendo una solución moderna, elegante, intuitiva y altamente escalable.

El producto debe transmitir calidad, simplicidad y profesionalismo.

Cada funcionalidad debe aportar valor real al negocio.

---

# Misión

Ayudar a barberías y salones a:

• aumentar ingresos

• reducir cancelaciones

• optimizar la agenda

• fidelizar clientes

• controlar empleados

• administrar inventario

• automatizar procesos

• obtener métricas del negocio

Todo desde una única plataforma.

---

# Público objetivo

## Principal

Barberías pequeñas

1 a 5 empleados

---

## Secundario

Barberías medianas

5 a 20 empleados

---

## Futuro

Cadenas de barberías

Salones de belleza

Centros de estética

Spa

Clínicas estéticas

---

# Modelo de negocio

Software como Servicio (SaaS)

Planes por suscripción mensual y anual.

Cada negocio administra su propia información mediante arquitectura Multi-Tenant.

---

# Estado actual del proyecto

Estado:

En desarrollo.

Fase:

MVP Avanzado.

---

# Actualización reciente

Fecha:

2026-07-01

Se completó el diseño funcional del módulo de Inventario siguiendo el flujo oficial de feature.

También se realizó revisión técnica (CTO) y evaluación estratégica (Strategic Board) para validar riesgos, alcance y condiciones de implementación.

Estado del módulo Inventario:

Definición funcional completada.

Implementación pendiente.

Riesgos críticos identificados para resolver antes de escalar:

- Trazabilidad de movimientos de stock no integrada end-to-end.
- Desalineación de permisos entre UI y API en acciones de inventario.
- Riesgo de aislamiento multi-tenant a validar y endurecer.

---

# Objetivos del MVP

El MVP debe permitir que una barbería pueda operar completamente desde Ornó.

Debe incluir:

✔ Login

✔ Gestión de clientes

✔ Gestión de empleados

✔ Reservas

✔ Agenda

✔ Servicios

✔ Dashboard

✔ Configuración

✔ Historial

✔ Perfil

✔ Permisos

✔ Facturación

✔ Integraciones

---

# Roles del sistema

Actualmente existen tres roles principales.

## Administrador

Gestiona completamente el negocio.

Tiene acceso total.

---

## Empleado

Gestiona su agenda.

Consulta estadísticas personales.

Administra disponibilidad.

Visualiza clientes asignados.

---

## Cliente

Reserva citas.

Consulta historial.

Gestiona perfil.

Visualiza beneficios.

Recibe promociones.

---

# Principios del proyecto

Todo desarrollo debe respetar estos principios.

## Escalabilidad

Cada módulo debe poder crecer sin romper el resto del sistema.

---

## Modularidad

Cada funcionalidad debe estar desacoplada.

---

## Reutilización

Evitar duplicar componentes.

---

## Seguridad

Toda acción debe validarse mediante autenticación y autorización.

---

## Performance

La aplicación debe sentirse rápida incluso con grandes volúmenes de datos.

---

## UX Premium

El usuario debe sentir que utiliza un software moderno.

No desarrollar pantallas únicamente funcionales.

Cada pantalla debe transmitir calidad.

---

# Identidad del producto

Ornó representa:

Elegancia.

Minimalismo.

Profesionalismo.

Rapidez.

Confiabilidad.

Tecnología.

---

# Estilo visual

Tema principal:

Dark Premium.

Color primario:

Rojo Ornó.

Diseño limpio.

Mucho espacio en blanco (o negro).

Cards con bordes suaves.

Animaciones discretas.

Jerarquía visual clara.

---

# Tecnologías

Consultar:

context/stack.md

---

# Arquitectura

Consultar:

context/architecture.md

---

# Design System

Consultar:

context/design-system.md

---

# Roadmap

Consultar:

context/roadmap.md

---

# Estado de los módulos

## Administración

En desarrollo.

---

## Clientes

En desarrollo.

---

## Empleados

En desarrollo.

---

## Reservas

En desarrollo.

---

## Inventario

Pendiente.

---

## Reportes

En desarrollo.

---

## Configuración

En desarrollo.

---

## Facturación

En desarrollo.

---

## Integraciones

Pendiente.

---

## Auditoría

Pendiente.

---

## Seguridad

Pendiente.

---

# Objetivo técnico

El código debe poder mantenerse durante los próximos 10 años.

Las decisiones deben priorizar la mantenibilidad sobre la velocidad.

---

# Objetivo comercial

Crear una plataforma capaz de competir con los mejores SaaS del mercado para barberías y salones.

No construir simplemente "otro sistema de reservas".

Construir el sistema operativo del negocio.

---

# Regla de Oro

Antes de desarrollar cualquier funcionalidad, responder siempre estas preguntas:

1. ¿Aporta valor al negocio?

2. ¿Es escalable?

3. ¿Puede reutilizarse?

4. ¿Respeta la arquitectura?

5. ¿Mejora la experiencia del usuario?

Si alguna respuesta es "No", replantear la implementación antes de comenzar.