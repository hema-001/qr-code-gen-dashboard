import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Define public paths that don't require authentication
  const publicPaths = ['/signin', '/error-404']
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  let isValidToken = false
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jwtVerify(token, secret)
      isValidToken = true
    } catch (error) {
      // Token is invalid or expired
    }
  }

  // If the user is not authenticated and trying to access a protected route
  if (!isValidToken && !isPublicPath) {
    // Redirect to the sign-in page
    const response = NextResponse.redirect(new URL('/signin', request.url))
    if (token) {
      response.cookies.delete('token')
    }
    return response
  }

  // If the user is authenticated and trying to access the sign-in page
  if (isValidToken && pathname.startsWith('/signin')) {
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
