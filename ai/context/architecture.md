# ORNÓ

# Architecture

Versión: 1.0

---

# Objetivo

Este documento describe la arquitectura oficial de Ornó.

Todo cambio estructural importante debe reflejarse aquí.

Este documento es la fuente de verdad para cualquier IA o desarrollador que necesite comprender la organización técnica del proyecto.

---

# Stack Oficial

Consultar:

context/stack.md

---

# Arquitectura General

Ornó está construido siguiendo una arquitectura modular basada en dominios.

Cada módulo debe ser independiente y reutilizable.

Los módulos se comunican mediante interfaces bien definidas.

Debe evitarse el acoplamiento entre módulos.

---

# Principios

- Modularidad
- Escalabilidad
- Reutilización
- Seguridad
- Separación de responsabilidades
- Componentes desacoplados

---

# Capas

## Presentación

Responsable de la interfaz.

Incluye:

- Pages
- Layouts
- Components
- Hooks de UI

---

## Aplicación

Responsable de la lógica de negocio.

Incluye:

- Services
- Actions
- Validaciones
- Casos de uso

---

## Persistencia

Responsable del acceso a datos.

Incluye:

- Supabase
- PostgreSQL
- Storage

---

# Autenticación

Proveedor:

Supabase Auth

Roles:

- Admin
- Employee
- Client

El acceso siempre debe validarse mediante autenticación y autorización.

---

# Multi-Tenant

Toda la información pertenece a un negocio (tenant).

Ningún negocio puede acceder a datos de otro.

Las consultas deben respetar las políticas RLS de Supabase.

---

# Componentes

Todo componente debe ser:

- Reutilizable
- Tipado
- Independiente
- Documentado cuando sea necesario

---

# Convenciones

- TypeScript estricto
- Componentes pequeños
- Evitar lógica compleja en la UI
- Hooks para lógica reutilizable
- Services para acceso a datos

---

# Seguridad

Todo acceso debe validar:

- Usuario autenticado
- Rol autorizado
- Tenant correcto

---

# Testing

Priorizar:

- QA automatizado
- Playwright
- Pruebas manuales para UX

---

# Performance

Siempre considerar:

- Server Components cuando sea posible
- Lazy Loading
- Optimización de consultas
- Cache cuando aplique

---

# Regla de Oro

Si una implementación rompe la modularidad o dificulta el mantenimiento, debe replantearse antes de desarrollarse.