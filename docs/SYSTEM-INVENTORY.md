# Barber Manager - System Inventory

Version: 1.0
Last Updated: 11 June 2026

---

# 1. Project Overview

Barber Manager es una plataforma SaaS para la gestión integral de barberías y salones.

El sistema permite:

* Gestión de clientes
* Gestión de empleados/barberos
* Reservas online
* Control de citas
* Control de asistencia
* Seguimiento de horarios
* Programa de fidelización
* Inventario
* Punto de venta (POS)
* Reportes administrativos
* Notificaciones automáticas
* Autenticación mediante Supabase

---

# 2. Technology Stack

## Frontend

* Next.js 15
* React 19
* TypeScript
* TailwindCSS
* Radix UI
* Zustand
* React Hook Form
* Zod

## Backend

* Next.js API Routes
* Supabase
* PostgreSQL

## Notifications

* Twilio (SMS / WhatsApp)
* Resend (Email)

## Security

* Rate Limiting
* Security Headers
* Input Validation
* Security Logging

## Testing

* Vitest
* Playwright

---

# 3. Application Structure

## /app

Application routes and pages.

### Authentication

/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password

### Dashboard

/dashboard

### Admin

/admin
/admin/appointments
/admin/employees
/admin/services
/admin/clients
/admin/inventory
/admin/reports
/admin/settings
/admin/share
/admin/pos

### Client

/client
/client/appointments
/client/book
/client/history

### Employee

/employee
/employee/dashboard
/employee/schedule
/employee/time-tracking
/employee/stats
/employee/profile

### Booking

/book/[slug]
/reservar

### Public Pages

/privacy
/terms

---

# 4. Components Inventory

## Authentication

* login-form
* register-form
* terms-modal

## Booking Components

* ServiceCard
* BarberCard
* Calendar
* TimeSlot
* BookingSummary
* Stepper
* signup-prompt-modal

## Client Components

* CancelAppointmentModal
* RescheduleModal
* RatingModal

## Dashboard

* stats-card

## Admin Components

### Appointments

* appointment-modal
* delete-confirm-modal

### Employees

* employee-modal
* delete-confirm-modal

### Services

* service-modal
* delete-confirm-modal

### Clients

* client-modal
* loyalty-modal
* delete-confirm-modal

### Inventory

* inventory-modal
* delete-confirm-modal

## Layout Components

### Admin

* admin-sidebar

### Client

* client-sidebar
* client-bottom-nav

### Employee

* employee-sidebar
* employee-bottom-nav

## UI Components

* alert
* badge
* button
* card
* dialog
* input
* label
* select
* textarea
* toast

---

# 5. Hooks

## useAuth

Responsible for:

* Authentication state
* User session
* Login status
* Logout

## useRequireAuth

Responsible for:

* Route protection
* Role validation
* Redirects

---

# 6. Core Libraries

## Authentication

lib/auth.ts

Responsibilities:

* Authentication helpers
* Session utilities

## Supabase

lib/supabase/client.ts
lib/supabase/server.ts

Responsibilities:

* Database access
* Authentication access
* Server-side operations

## Validation

lib/validation.ts
lib/schemas.ts

Responsibilities:

* Zod validation
* Input sanitization

## Security

lib/security-headers.ts
lib/security-logger.ts
lib/rate-limit.ts

Responsibilities:

* Security headers
* Audit logs
* Request limiting

## Environment

lib/env.ts

Responsibilities:

* Environment validation
* Secret verification

---

# 7. API Routes

## Authentication

POST /api/auth/login
POST /api/auth/activate-account
POST /api/auth/forgot-password
GET /api/auth/callback

## Appointments

GET/POST /api/appointments

POST /api/appointments/[id]/cancel

POST /api/appointments/[id]/reschedule

POST /api/appointments/[id]/rate

GET /api/appointments/admin

## Employees

GET/POST /api/employees

POST /api/employees/[id]/commission

## Clients

GET/POST /api/clients

## Attendance

GET/POST /api/attendance

GET/PUT /api/attendance/[id]

## Loyalty

GET/POST /api/loyalty

## POS

GET/POST /api/pos

## Reports

GET /api/reports

## Alerts

GET/POST /api/alerts

## Schedule Blocks

GET/POST /api/schedule-blocks

## Notifications

POST /api/notifications/send

POST /api/notifications/queue

## Public Booking

GET /api/bookings/public

---

# 8. Supabase Database Inventory

## users

Stores:

* Clients
* Employees
* Administrators

Key fields:

* role
* loyalty_points
* commission_rate
* no_show_count

---

## services

Stores service catalog.

Examples:

* Haircut
* Beard Trim
* Hair Wash

---

## appointments

Stores reservations and appointments.

Features:

* Ratings
* Reviews
* Notes
* Status tracking

---

## attendance_logs

Employee attendance records.

---

## time_logs

Work hour tracking.

Includes:

* Check-in
* Check-out
* Breaks

---

## barber_commissions

Employee commission calculations.

---

## barber_avg_ratings

Average rating calculations.

---

## inventory

Product inventory.

---

## inventory_movements

Inventory movement history.

---

## loyalty_transactions

Customer loyalty points history.

---

## client_messages

Messages from admin to clients.

---

## client_gifts

Promotions and gifts for customers.

---

## pos_sales

Sales records.

---

## pos_sale_items

Sales line items.

---

## schedule_blocks

Blocked employee schedules.

Examples:

* Vacation
* Breaks
* Personal leave

---

## notification_queue

Email and SMS queue.

---

## low_rating_alerts

Tracks ratings of 1–2 stars.

Used for quality control.

---

## business_settings

Business configuration settings.

---

# 9. Notification System

Current Providers:

## Twilio

Used for:

* SMS
* WhatsApp

## Resend

Used for:

* Email notifications

Queue table:

notification_queue

---

# 10. Security Inventory

Implemented:

* Rate Limiting
* Environment Validation
* Secret Detection
* Input Validation
* XSS Protection
* SQL Injection Detection
* Security Headers
* Security Logs

Documentation:

* SECURITY-IMPLEMENTATION.md
* SECURITY-CHECKLIST.md
* QUICK-START-SECURITY.md
* SECRET-ROTATION.md

---

# 11. Current Functional Modules

## Client Module

Status: Implemented

Features:

* Book appointment
* View appointments
* Appointment history
* Rate service
* Loyalty points

---

## Employee Module

Status: Implemented

Features:

* Dashboard
* Schedule
* Attendance
* Time tracking
* Performance statistics

---

## Admin Module

Status: Implemented

Features:

* Clients
* Employees
* Services
* Inventory
* Reports
* POS
* Settings

---

# 12. Planned Integrations

## Reservation Dashboard

Status: Pending Integration

Purpose:

* Real-time booking monitoring
* Reservation analytics
* Occupancy metrics

---

## Billing System

Status: Pending Integration

Purpose:

* Electronic invoicing
* Tax calculation
* Invoice generation
* Invoice history

---

## External Integrations Hub

Status: Pending Integration

Potential Integrations:

* Stripe
* PayPal
* WhatsApp Cloud API
* Google Calendar
* Meta Pixel
* Google Analytics
* QuickBooks
* Xero

---

# 13. Project Status

Current Phase:

Supabase Migration & Functional Expansion

Completed:

* Authentication
* Booking System
* Admin Dashboard
* Employee Dashboard
* Client Dashboard
* Security Hardening
* Notifications

In Progress:

* Supabase Data Integration
* Production Data Migration

Next Steps:

1. Connect all dashboards to Supabase.
2. Replace demo data.
3. Build Reservation Analytics Dashboard.
4. Build Billing Module.
5. Build Integrations Center.
6. Deploy Production Version.
