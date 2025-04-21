"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { status } = useSession();
  
  // Create a ref to track pathname changes
  const previousPathRef = useRef<string | null>(null);
  
  // Handle initial session loading
  useEffect(() => {
    // Keep loader visible while NextAuth is determining session status
    if (status === 'loading') {
      setIsLoading(true);
      
      // Safety timeout - never show loading for more than 10 seconds
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout reached - forcing hide of loader');
        setIsLoading(false);
      }, 10000);
      
      return () => clearTimeout(safetyTimeout);
    } else {
      // Once session status is determined (authenticated or unauthenticated), 
      // give a short delay then hide the loader
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [status]);
  
  // Handle route changes after initial load
  useEffect(() => {
    // Skip if we're still in initial session loading
    if (status === 'loading') return;
    
    // Check if pathname actually changed
    if (previousPathRef.current !== pathname) {
      setIsLoading(true);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      // Update the ref with current pathname
      previousPathRef.current = pathname;
      
      return () => clearTimeout(timer);
    }
  }, [pathname, status]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative">
        <Building2 className="h-12 w-12 text-primary animate-pulse" />
        <div className="loader-ring"></div>
      </div>
      
      <div className="mt-4 flex space-x-2">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}