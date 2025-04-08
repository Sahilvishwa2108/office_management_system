"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show loading bar on navigation
    setIsLoading(true);
    
    // Hide after a short delay to ensure animation is visible
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <>
      <div className="pulse-loader">
        <div className="pulse-loader-dot"></div>
      </div>
    </>
  );
}