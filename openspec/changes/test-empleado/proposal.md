# Test E2E Empleado

## Intent
Validate the end-to-end flow of the employee dashboard, ensuring barbers can log in, view their daily appointments, manage their work status (clock in/out), and update appointment statuses.

## Scope
- Employee Login (simulated or via UI)
- Dashboard rendering
- Clock-in and Clock-out functionality
- Viewing "Citas Hoy"
- Changing appointment status (Completar / Cancelar)

## Approach
Create a new Playwright test `e2e/employee.e2e.spec.ts`.
We will:
1. Prepare the DB with a known employee user and a test appointment.
2. Login as the employee (using the auth route or by injecting session).
3. Navigate to `/employee/dashboard`.
4. Verify stats are visible.
5. Click "Iniciar Jornada" and verify state changes.
6. Find a test appointment and click "Completar".
7. Verify the status updates in UI.
