import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ["/dashboard", "/admin", "/employee", "/client"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Role-based route protection
  if (user && isProtectedRoute) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    const userRole = userData?.role

    // Admin routes
    if (request.nextUrl.pathname.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Employee routes
    if (request.nextUrl.pathname.startsWith("/employee") && userRole !== "employee" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Client routes
    if (request.nextUrl.pathname.startsWith("/client") && userRole !== "client" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
