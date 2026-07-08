// Single source of role-based routing truth.
//
// Consumed by the edge middleware, the client-side auth guard, the login
// flow and the shell navigation manifests — keep this file edge-safe:
// pure constants only, no imports, no client/server APIs.
//
// Multi-tenant note: when tenants land, this becomes roleHome(role, tenant)
// and every consumer picks the change up from this one file.

export const ROLE_HOME = {
  admin: "/admin",
  employee: "/employee/dashboard",
  client: "/client",
} as const

export const LOGIN_ROUTE = "/auth/login"

/** Portal home for a role; unknown/missing roles go to login. */
export function roleHome(role: string | null | undefined): string {
  return (role && (ROLE_HOME as Record<string, string>)[role]) || LOGIN_ROUTE
}
