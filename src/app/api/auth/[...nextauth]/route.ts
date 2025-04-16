import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Only export the route handlers
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);