import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

const isProduction = process.env.NODE_ENV === "production";

// Get your actual domain from the URL
const getVercelDomain = () => {
  if (!process.env.NEXTAUTH_URL) return undefined;
  try {
    const url = new URL(process.env.NEXTAUTH_URL);
    // Only return the domain for production
    return isProduction ? url.hostname : undefined;
  } catch {
    return undefined;
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const normalizedEmail = credentials.email.toLowerCase().trim();  
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true, 
            avatar: true, 
            isActive: true, 
            password: true,
            canApproveBilling: true, // Include canApproveBilling for admin checks
          }, // Include avatar, isActive, and password
        });

        if (!user) {
          return null;
        }

        // Check if user is blocked (inactive)
        if (user.isActive === false) {
          throw new Error("AccountBlocked");
        }

        const passwordMatches = await compare(credentials.password, user.password || "");

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          canApproveBilling: user.canApproveBilling,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          avatar: user.avatar || null,
          canApproveBilling: user.canApproveBilling || false, // Include canApproveBilling in the token
        };
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true, avatar: true, canApproveBilling: true }, // Include canApproveBilling for admin checks
        });

        if (!user || !user.isActive) {
          return {
            ...token,
            blocked: true,
          };
        }

        return {
          ...token,
          avatar: user.avatar || null,
          canApproveBilling: user.canApproveBilling || false, // Include canApproveBilling in the token
        };
      } catch (error) {
        console.error("Database error in JWT callback:", error);
        // Return token anyway to prevent login blocking
        return token;
      }
    },

    async session({ session, token }) {
      if (token.blocked) {
        return { ...session, blocked: true };
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role,
          avatar: token.avatar || null,
          canApproveBilling: token.canApproveBilling || false, // Include canApproveBilling in the session
        },
      };
    },

    async signIn({ user }) {
      if (user.id) {
        try {
          await logActivity(
            "user",
            "login",
            user.name || user.email || "Unknown user",
            user.id
          );
        } catch (error) {
          console.error("Failed to log login activity:", error);
        }
      }

      return true;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { name: true },
          });

          await logActivity(
            "user",
            "logout",
            user?.name || "Unknown user",
            token.sub
          );
        } catch (error) {
          console.error("Failed to log logout activity:", error);
        }
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `${isProduction ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        // This is the critical fix - use your actual domain, not .vercel.app
        domain: getVercelDomain()
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};