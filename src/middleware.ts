import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = createRouteMatcher([
  '/',
  '/sign-in(.*)',
])

// Define routes that require specific roles
const adminRoutes = createRouteMatcher([
  '/dashboard/admin(.*)',
  '/sign-up(.*)'  // Add sign-up to admin routes to restrict access
])

const partnerRoutes = createRouteMatcher(['/dashboard/team(.*)', '/dashboard/add-employee(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Special case for sign-up page accessed directly
  if (req.nextUrl.pathname.startsWith('/sign-up')) {
    // Get auth data
    const { userId, sessionClaims } = await auth()
    
    // If not authenticated, redirect to sign-in
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    
    // Look for role in the correct place - publicMetadata
    const userRole = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
    
    console.log("User role from session claims:", userRole);
    
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // Admin can access sign-up page
    return NextResponse.next()
  }
  
  // Handle other public routes
  if (publicRoutes(req)) {
    return NextResponse.next()
  }

  // Get auth data
  const { userId, sessionClaims } = await auth()

  // If no auth, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Get user role from publicMetadata
  const userRole = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
  console.log("Middleware check - User ID:", userId);
  console.log("Middleware check - User Role:", userRole);
  console.log("Middleware check - Session Claims:", JSON.stringify(sessionClaims));

  // If no role is set and not on onboarding page, redirect to onboarding
  if (!userRole && !req.nextUrl.pathname.startsWith('/onboarding')) {
    console.log("Redirecting to onboarding because no role found");
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Role-based access control
  if (adminRoutes(req) && userRole !== 'ADMIN') {
    // Only admins can access admin routes
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (partnerRoutes(req) && userRole !== 'ADMIN' && userRole !== 'PARTNER') {
    // Only admins and partners can access these routes
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Continue to the requested route
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}