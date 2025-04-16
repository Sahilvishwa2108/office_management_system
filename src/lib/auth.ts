import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
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
        };
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true },
        });

        if (!user || !user.isActive) {
          return {
            ...token,
            blocked: true,
          };
        }

        return token;
      } catch (error) {
        console.error("Error checking user status during token refresh:", error);
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
  debug: process.env.NODE_ENV === "development",
};