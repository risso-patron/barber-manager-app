# ORNÓ AI Operating System (AI OS)

## Versión

v1.0

---

# Propósito

Este directorio contiene el sistema de trabajo basado en Inteligencia Artificial utilizado para desarrollar Ornó.

No es una colección de prompts.

Es un sistema operativo para coordinar múltiples agentes especializados que colaboran en el desarrollo del producto.

Cada agente tiene responsabilidades específicas y nunca debe asumir funciones que pertenecen a otro agente.

El objetivo es mantener consistencia técnica, calidad del código, visión de producto y documentación durante todo el ciclo de vida del proyecto.

---

# Filosofía

Ornó se desarrolla siguiendo cinco principios:

- Calidad antes que velocidad.
- Arquitectura antes que implementación.
- Componentes reutilizables antes que soluciones aisladas.
- Experiencia de usuario antes que cantidad de funcionalidades.
- Escalabilidad antes que atajos.

---

# Estructura

```
ai/

├── agents/
├── context/
├── prompts/
├── adr/
├── sessions/
└── README.md
```

---

# Agentes

## CTO

Responsable de:

- Arquitectura
- Código
- Seguridad
- Performance
- Escalabilidad
- Base de datos
- QA técnico

Nunca toma decisiones comerciales.

---

## Product Lab

Responsable de:

- UX
- UI
- Figma
- Design System
- Roadmap funcional
- Experiencia de usuario

Nunca modifica arquitectura.

---

## Strategic Board

Consejo estratégico formado por especialistas.

Evalúa:

- Valor del producto
- Monetización
- Roadmap
- Benchmark
- Diferenciación
- Riesgos

Nunca escribe código.

---

## Context Architect

Mantiene actualizado el conocimiento del proyecto.

Es responsable de:

- project.md
- roadmap.md
- architecture.md
- decisions.md
- sessions/

Nunca implementa funcionalidades.

---

# Contexto

Todo agente debe consultar la carpeta context antes de responder.

Especialmente:

- project.md
- architecture.md
- roadmap.md

No debe asumir información que no exista.

---

# ADR

Todas las decisiones importantes deben documentarse mediante un ADR.

Ejemplos:

- Cambio de arquitectura
- Nueva tecnología
- Cambio de autenticación
- Cambio de base de datos
- Nuevo módulo importante

Nunca modificar un ADR existente.

Siempre crear uno nuevo.

---

# Sessions

Cada sesión de trabajo debe documentarse.

Debe incluir:

Fecha

Objetivos

Trabajo realizado

Problemas encontrados

Pendientes

Próximo paso

---

# Flujo de trabajo

Nueva funcionalidad

↓

Product Lab

↓

Strategic Board

↓

CTO

↓

Implementación

↓

QA

↓

Context Architect

↓

Actualizar documentación

---

# Objetivo final

Construir Ornó como un SaaS premium para barberías y salones, manteniendo una arquitectura escalable, una experiencia de usuario sobresaliente y una documentación que permita continuar el desarrollo incluso años después.

---

# Regla de Oro

Ningún agente trabaja de forma aislada.

Todos deben colaborar respetando sus responsabilidades.

Cuando exista una duda, priorizar siempre la calidad del producto sobre la velocidad de implementación.