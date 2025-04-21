"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
    };
    
    const handleStop = () => {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Keep it visible briefly even after route is ready
      
      return () => clearTimeout(timer);
    };
    
    // Set loading to true immediately when route changes
    setIsLoading(true);
    
    // Hide loader after a delay to allow page content to start rendering
    const timer = setTimeout(handleStop, 800);
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

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
      
      <div className="mt-4 text-primary/80 font-medium">
        Loading...
      </div>
      
      <div className="mt-2 flex space-x-2">
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