import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// Define route permissions
const routePermissions = {
  // Public routes don't need to be listed
  // Admin routes
  "/dashboard/admin": ["ADMIN"],
  "/dashboard/admin/users": ["ADMIN"],
  "/dashboard/admin/clients": ["ADMIN"], // <-- Add this line to explicitly allow the route
  "/dashboard/admin/users/create": ["ADMIN"],
  // Admin or Partner routes
  "/dashboard/manage-users": ["ADMIN", "PARTNER"],
  // Partner routes
  "/dashboard/partner": ["ADMIN", "PARTNER"],
  "/dashboard/partner/users/create": ["ADMIN", "PARTNER"],
  "/dashboard/partner/users": ["ADMIN", "PARTNER"],
  "/dashboard/partner/users/[id]": ["ADMIN", "PARTNER"], // Only view details
  // Restrict these routes to ADMIN only
  "/dashboard/partner/users/[id]/edit": ["ADMIN"],
  "/dashboard/partner/users/[id]/reset-password": ["ADMIN"],
  // Junior staff routes
  "/dashboard/junior": ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"],
  // Client management routes - accessible to all staff
  "/dashboard/clients": ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"],
  "/dashboard/clients/create": ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE"],
  "/dashboard/clients/guest/create": ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE"],
  // All authenticated users
  "/dashboard": ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and API routes to avoid infinite loops
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || // Skip ALL API routes to prevent loops
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/set-password" ||
    pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not signed in - redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user is blocked based on JWT token
  if (token.isActive === false) {
    return NextResponse.redirect(new URL("/login?blocked=true", request.url));
  }

  // Handle root redirect
  if (pathname === "/") {
    // User is logged in - redirect based on role
    const userRole = token.role as string;
    
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    } else if (userRole === "PARTNER") {
      return NextResponse.redirect(new URL("/dashboard/partner", request.url)); 
    } else if (["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"].includes(userRole)) {
      // Redirect junior staff
      return NextResponse.redirect(new URL("/dashboard/junior", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Find matching route permission pattern
  const matchedRoute = Object.keys(routePermissions).find(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check role-based access
  if (matchedRoute) {
    const userRole = token.role as string;
    const allowedRoles = routePermissions[matchedRoute as keyof typeof routePermissions];
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      } else if (userRole === "PARTNER") {
        return NextResponse.redirect(new URL("/dashboard/partner", request.url));
      } else if (["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard/junior", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};