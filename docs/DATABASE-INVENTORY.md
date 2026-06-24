# Barber Manager - Database Inventory

Version: 1.0
Last Updated: 11 June 2026

---

# Overview

Base de datos principal alojada en Supabase (PostgreSQL).

Actualmente el sistema posee una arquitectura relacional orientada a:

* Gestión de usuarios
* Reservas
* Servicios
* Inventario
* Fidelización
* Asistencia
* Punto de venta
* Notificaciones
* Reportes

---

# Database Statistics

## Total Tables

18

## Main Modules

* Authentication
* Users
* Services
* Appointments
* Attendance
* Time Tracking
* Loyalty Program
* Inventory
* Point Of Sale
* Notifications
* Reports
* Business Settings

---

# Entity Relationship Summary

auth.users
└── users
├── appointments
├── attendance_logs
├── time_logs
├── loyalty_transactions
├── client_messages
├── client_gifts
├── pos_sales
├── schedule_blocks
└── low_rating_alerts

services
└── appointments

appointments
├── loyalty_transactions
└── low_rating_alerts

inventory
└── inventory_movements

pos_sales
└── pos_sale_items

---

# USERS

Table: users

Purpose:

Central user repository.

Stores:

* Clients
* Employees
* Administrators

Primary Key:

id (UUID)

Relationships:

* appointments.client_id
* appointments.barber_id
* attendance_logs.user_id
* time_logs.employee_id
* loyalty_transactions.user_id
* pos_sales.client_id
* schedule_blocks.barber_id

Important Fields:

| Field           | Type      |
| --------------- | --------- |
| role            | user_role |
| loyalty_points  | integer   |
| commission_rate | numeric   |
| no_show_count   | integer   |

Roles:

* admin
* employee
* client

---

# SERVICES

Table: services

Purpose:

Service catalog.

Examples:

* Haircut
* Beard Trim
* Hair Coloring
* Hair Wash

Important Fields:

| Field     | Type    |
| --------- | ------- |
| name      | varchar |
| price     | numeric |
| duration  | integer |
| is_active | boolean |

---

# APPOINTMENTS

Table: appointments

Purpose:

Reservation management.

Status Values:

* pending
* confirmed
* completed
* cancelled
* no_show

Features:

* Ratings
* Reviews
* Feedback
* Notes
* Commission calculation

Relationships:

* users
* services

Important Fields:

| Field            | Type               |
| ---------------- | ------------------ |
| appointment_date | date               |
| appointment_time | time               |
| status           | appointment_status |
| rating           | integer            |

---

# ATTENDANCE LOGS

Table: attendance_logs

Purpose:

Employee attendance control.

Stores:

* Check-in
* Check-out

---

# TIME LOGS

Table: time_logs

Purpose:

Work-hour tracking.

Stores:

* Clock in
* Clock out
* Break start
* Break end
* Total hours

---

# INVENTORY

Table: inventory

Purpose:

Stock management.

Stores:

* Products
* Supplies
* Consumables

Important Fields:

| Field     | Type    |
| --------- | ------- |
| quantity  | integer |
| min_stock | integer |
| supplier  | varchar |
| category  | varchar |

Future Features:

* Automatic low stock alerts
* Supplier management

---

# INVENTORY MOVEMENTS

Table: inventory_movements

Purpose:

Inventory audit trail.

Movement Types:

* entry
* exit
* adjustment

Stores:

* Quantity changed
* Reason
* User responsible

---

# LOYALTY TRANSACTIONS

Table: loyalty_transactions

Purpose:

Customer loyalty program.

Transaction Types:

* earn
* redeem
* adjustment
* expire

Stores:

* Points earned
* Points redeemed
* Manual adjustments

---

# CLIENT MESSAGES

Table: client_messages

Purpose:

Internal communication.

Stores:

* Messages
* Notifications
* Promotions

---

# CLIENT GIFTS

Table: client_gifts

Purpose:

Promotional rewards.

Gift Types:

* discount_pct
* discount_fixed
* free_service
* free_product

Features:

* Expiration date
* Redemption tracking
* Gift codes

---

# POS SALES

Table: pos_sales

Purpose:

Point of Sale transactions.

Stores:

* Sales
* Discounts
* Tips
* Payment methods

Payment Methods:

* cash
* card
* transfer

---

# POS SALE ITEMS

Table: pos_sale_items

Purpose:

Detailed sale breakdown.

Item Types:

* service
* product

Stores:

* Quantity
* Unit price
* Subtotal

---

# SCHEDULE BLOCKS

Table: schedule_blocks

Purpose:

Barber availability control.

Block Types:

* break
* absence
* personal
* vacation

Used By:

* Reservation system
* Employee dashboard

---

# NOTIFICATION QUEUE

Table: notification_queue

Purpose:

Notification processing queue.

Notification Types:

* appointment_created
* reminder
* cancellation
* confirmation

Status:

* pending
* processing
* sent
* failed

Providers:

* Twilio
* Resend

---

# LOW RATING ALERTS

Table: low_rating_alerts

Purpose:

Customer satisfaction monitoring.

Triggered When:

Rating <= 2

Stores:

* Review
* Employee involved
* Resolution status

Used By:

* Admin dashboard
* Quality control system

---

# BUSINESS SETTINGS

Table: business_settings

Purpose:

Global application configuration.

Examples:

* Business hours
* Loyalty rules
* Notification settings
* Reservation limits

---

# FUTURE DATABASE MODULES

## Billing

Planned Tables:

* invoices
* invoice_items
* tax_rates
* payment_transactions

---

## Reservation Analytics

Planned Tables:

* reservation_metrics
* occupancy_stats
* booking_sources

---

## Integrations

Planned Tables:

* integrations
* integration_logs
* webhooks
* api_tokens

---

# Security

Implemented:

* Supabase Authentication
* Foreign Keys
* Check Constraints
* UUID Primary Keys

Recommended Next Step:

Implement Row Level Security (RLS) on all business tables.

Priority:

HIGH

---

# Current Database Status

Tables: 18

Relationships: Configured

Supabase Authentication: Active

Application Integration: In Progress

Production Readiness: 80%
