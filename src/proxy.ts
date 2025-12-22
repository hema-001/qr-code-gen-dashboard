import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Define public paths that don't require authentication
  const publicPaths = ['/signin', '/error-404']
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // If the user is not authenticated and trying to access a protected route
  if (!token && !isPublicPath) {
    // Redirect to the sign-in page
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // If the user is authenticated and trying to access the sign-in page
  if (token && pathname.startsWith('/signin')) {
    // Redirect to the dashboard
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - icons (public icons)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
}
