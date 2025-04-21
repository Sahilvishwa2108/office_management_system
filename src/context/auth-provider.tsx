"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session } from "next-auth";

// Create auth context type
interface AuthContextType {
  checkRoleChange: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role validation component that sits inside SessionProvider
function RoleValidator({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const originalFetchRef = useRef<typeof fetch | null>(null);
  
  // Function to validate role
  const checkRoleChange = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/auth/validate-role', {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store',
        // Add a timestamp to prevent caching
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Request-Time': Date.now().toString()
        }
      });
      
      if (!response.ok && response.status === 401) {
        // Check if the header indicates a role change
        if (response.headers.get('X-Role-Changed')) {
          console.log("Role change detected, forcing logout");
          toast("Role Changed", {
            description: "Your role has been changed. You'll be logged out.",
            position: "top-center"
          });
          
          // Small delay to show the toast
          setTimeout(async () => {
            await signOut({ redirect: false });
            router.push('/login?reason=role-changed');
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Error checking role:", error);
    }
  };
  
  // Set up fetch interceptor to detect role changes in API responses
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      originalFetchRef.current = originalFetch;
      
      window.fetch = async function(...args) {
        // Use the original fetch with original "this" binding
        const response = await originalFetch.apply(window, args);
        
        try {
          // Check for role change header
          if (response.headers.get('X-Role-Changed')) {
            console.log("Role change detected in API response");
            toast("Role Changed", {
              description: "Your role has been changed. You'll be logged out.",
              position: "top-center"
            });
            
            setTimeout(async () => {
              await signOut({ redirect: false });
              router.push('/login?reason=role-changed');
            }, 1500);
          }
        } catch (error) {
          console.error("Error in fetch interceptor:", error);
        }
        
        return response;
      };
      
      // Cleanup function
      return () => {
        if (originalFetchRef.current) {
          window.fetch = originalFetchRef.current;
        }
      };
    }
  }, [router]);
  
  // Periodically check for role changes (every 5 minutes)
  useEffect(() => {
    if (!session?.user) return;
    
    // Check once on mount
    checkRoleChange();
    
    // Set up periodic checking
    const interval = setInterval(() => {
      checkRoleChange();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [session]);
  
  return (
    <AuthContext.Provider value={{ checkRoleChange }}>
      {children}
    </AuthContext.Provider>
  );
}

// Main auth provider that includes session and role validation
export function AuthProvider({ children, session }: { children: ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <RoleValidator>
        {children}
      </RoleValidator>
    </SessionProvider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}