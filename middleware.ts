import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/booking']
  const isPublicRoute = publicRoutes.some(route => url.pathname === route || url.pathname.startsWith(route))

  // Si no hay usuario y está intentando acceder a ruta protegida
  if (!user && !isPublicRoute) {
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Permitir acceso a /client para usuarios autenticados (verificaremos el rol después)
  if (user && url.pathname.startsWith('/client')) {
    // Dejar pasar para que se verifique el rol más adelante
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .ilike('email', user.email?.toLowerCase() || '')
      .single()
    
    // Solo permitir clientes en /client
    if (userData?.role !== 'client') {
      url.pathname = userData?.role === 'admin' ? '/admin' : '/employee'
      return NextResponse.redirect(url)
    }
    
    // Si es cliente, permitir acceso a /client
    return supabaseResponse
  }

  // Si hay usuario, verificar su rol y redirigir apropiadamente
  if (user) {
    // Normalizar email a minúsculas para evitar problemas
    const normalizedEmail = user.email?.toLowerCase() || ''
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .ilike('email', normalizedEmail) // ilike = case-insensitive LIKE
      .single()

    const userRole = userData?.role || 'employee'

    // Redirigir clientes a su dashboard /client (excepto si ya están en /client)
    if (userRole === 'client' && !url.pathname.startsWith('/client') && !isPublicRoute) {
      url.pathname = '/client'
      return NextResponse.redirect(url)
    }

    // Redirigir desde login a dashboard apropiado
    if (url.pathname === '/auth/login') {
      // Admin va a /admin, cliente a /client, secretaria y empleado a /employee
      if (userRole === 'admin') {
        url.pathname = '/admin'
      } else if (userRole === 'client') {
        url.pathname = '/client'
      } else {
        url.pathname = '/employee'
      }
      return NextResponse.redirect(url)
    }

    // Proteger ruta /admin - solo admins
    if (url.pathname.startsWith('/admin') && userRole !== 'admin') {
      url.pathname = '/employee'
      return NextResponse.redirect(url)
    }

    // Proteger ruta /employee - no permitir a admins (opcional)
    // if (url.pathname.startsWith('/employee') && userRole === 'admin') {
    //   url.pathname = '/admin'
    //   return NextResponse.redirect(url)
    // }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
