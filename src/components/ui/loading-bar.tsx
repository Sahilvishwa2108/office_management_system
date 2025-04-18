"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  
  // Store previous URL to detect changes including query params
  const [prevUrl, setPrevUrl] = useState("");
  
  useEffect(() => {
    // Initial setup - store current URL 
    if (typeof window !== 'undefined' && prevUrl === "") {
      setPrevUrl(window.location.href);
    }
  }, [prevUrl]);
  
  // Use pathname for route changes
  useEffect(() => {
    // Show loading bar on pathname changes
    setIsLoading(true);
    
    // Hide after a short delay to ensure animation is visible
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [pathname]);
  
  // Use URL checking for query parameter changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if URL has changed (would catch query param changes)
      const currentUrl = window.location.href;
      
      if (prevUrl !== "" && prevUrl !== currentUrl) {
        // URL changed including query params
        setIsLoading(true);
        setPrevUrl(currentUrl);
        
        // Hide after delay
        const timeout = setTimeout(() => {
          setIsLoading(false);
        }, 800);
        
        return () => clearTimeout(timeout);
      }
    }
    
    // Set up interval to check for URL changes
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        if (prevUrl !== currentUrl) {
          setPrevUrl(currentUrl);
          setIsLoading(true);
          
          setTimeout(() => {
            setIsLoading(false);
          }, 800);
        }
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, [prevUrl]);

  if (!isLoading) return null;

  return (
    <>
      <div className="pulse-loader">
        <div className="pulse-loader-dot"></div>
      </div>
    </>
  );
}