import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // DEMO MODE BYPASS — solo en desarrollo
  if (process.env.NODE_ENV === "development") {
    const path = request.nextUrl.pathname
    const protectedRoutes = ["/dashboard", "/admin", "/employee", "/barber", "/client"]
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

    const demoRole = request.cookies.get("demo-role")?.value
    if (demoRole) {
      // Verificar que el rol demo tiene acceso a la ruta
      if (path.startsWith("/admin") && demoRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      if (path.startsWith("/client") && demoRole !== "client" && demoRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      if (path.startsWith("/employee") && demoRole !== "employee" && demoRole !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return NextResponse.next({ request })
    }

    // Fallback para QA/demo en desarrollo cuando no hay cookie de rol.
    if (isProtectedRoute) {
      return NextResponse.next({ request })
    }
  }

  const { createServerClient } = await import("@supabase/ssr")
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware")
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

  const protectedRoutes = ["/dashboard", "/admin", "/employee", "/barber", "/client"]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (user && isProtectedRoute) {
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      if (!request.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return supabaseResponse
    }

    const userRole = userData?.role

    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (userRole === "admin") {
        // acceso total
      } else if (userRole === "manager") {
        const managerBlockedPaths = ["/admin/settings", "/admin/reports", "/admin/employees"]
        const isBlocked = managerBlockedPaths.some((p) =>
          request.nextUrl.pathname.startsWith(p)
        )
        if (isBlocked) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    if (
      (request.nextUrl.pathname.startsWith("/employee") ||
        request.nextUrl.pathname.startsWith("/barber")) &&
      userRole !== "employee" &&
      userRole !== "barber" &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (
      request.nextUrl.pathname.startsWith("/client") &&
      userRole !== "client" &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/barber/:path*",
    "/employee/:path*",
    "/client/:path*",
  ],
}