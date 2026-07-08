import { NextResponse, type NextRequest } from "next/server"
import { roleHome, LOGIN_ROUTE } from "@/lib/routes"

export async function middleware(request: NextRequest) {
  // DEMO MODE BYPASS — solo en desarrollo
  if (process.env.NODE_ENV === "development") {
    const demoRole = request.cookies.get("demo-role")?.value
    if (demoRole) {
      const path = request.nextUrl.pathname
      // Legacy role-router path: send bookmarks straight to the role home.
      if (path.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL(roleHome(demoRole), request.url))
      }
      if (path.startsWith("/admin") && demoRole !== "admin") {
        return NextResponse.redirect(new URL(roleHome(demoRole), request.url))
      }
      if (path.startsWith("/client") && demoRole !== "client" && demoRole !== "admin") {
        return NextResponse.redirect(new URL(roleHome(demoRole), request.url))
      }
      if (path.startsWith("/employee") && demoRole !== "employee" && demoRole !== "admin") {
        return NextResponse.redirect(new URL(roleHome(demoRole), request.url))
      }
      return NextResponse.next({ request })
    }
  }

  const { createServerClient } = await import("@supabase/ssr")
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware")
    // Demo mode without a session cookie: /dashboard no longer exists as a
    // page, so route the legacy path to login instead of a 404.
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
    }
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = ["/dashboard", "/admin", "/employee", "/client"]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
  }

  if (user && isProtectedRoute) {
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      // Role unknown (transient DB error): let the request through and let
      // the client-side guard (useRequireAuth) resolve — it is the same
      // decider the legacy /dashboard router delegated to.
      return supabaseResponse
    }

    const userRole = userData?.role

    // Legacy role-router path: send bookmarks straight to the role home.
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(roleHome(userRole), request.url))
    }

    if (request.nextUrl.pathname.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL(roleHome(userRole), request.url))
    }

    if (
      request.nextUrl.pathname.startsWith("/employee") &&
      userRole !== "employee" &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(new URL(roleHome(userRole), request.url))
    }

    if (
      request.nextUrl.pathname.startsWith("/client") &&
      userRole !== "client" &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(new URL(roleHome(userRole), request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/employee/:path*",
    "/client/:path*",
  ],
}