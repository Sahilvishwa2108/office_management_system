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
    <>
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
        .ripple-animation {
          animation: ripple 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        className={cn(
          "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm transition-all duration-500",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="relative h-24 w-24 flex items-center justify-center">
          {/* Ripple effect circles */}
          <div className="absolute inset-0 rounded-full bg-primary/10 ripple-animation"></div>
          <div className="absolute inset-0 rounded-full bg-primary/5 ripple-animation" style={{ animationDelay: '0.5s' }}></div>
          
          {/* Building icon with floating animation */}
          <div className="relative z-10 float-animation">
            <Building2 className="h-16 w-16 text-primary drop-shadow-lg" />
          </div>
          
          {/* Spinning ring around the icon */}
          <div className="absolute -inset-4 rounded-full border-4 border-t-primary/80 border-r-primary/30 border-b-primary/10 border-l-primary/50 animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>
        
        {/* Progress dots */}
        <div className="mt-4 flex space-x-3">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="h-3 w-3 rounded-full bg-primary animate-bounce shadow-sm"
              style={{ 
                animationDelay: `${i * 0.15}s`,
                opacity: 0.6 + (i * 0.2)
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}