"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { NProgressLoader } from "@/components/nprogress-loader";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initial page load with document readiness check
  useEffect(() => {
    const checkDocumentReady = () => {
      // Check if document is fully loaded including all assets
      if (document.readyState === 'complete') {
        setTimeout(() => {
          setIsLoading(false);
          setIsFirstLoad(false);
        }, 500);
      } else {
        // If not complete, listen for the load event
        window.addEventListener('load', handleDocumentLoad);
      }
    };
    
    const handleDocumentLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
        setIsFirstLoad(false);
      }, 500);
      window.removeEventListener('load', handleDocumentLoad);
    };
    
    // Initial delay to prevent flash
    const timer = setTimeout(checkDocumentReady, 300);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleDocumentLoad);
    };
  }, []);

  // Enhanced loading detection that combines MutationObserver with resource loading
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Create a mutation observer to detect when content is loading
    const observer = new MutationObserver((mutations) => {
      // Look for indicators that page is still loading
      const spinners = document.querySelectorAll(".animate-spin");
      const loaders = document.querySelectorAll("[data-loading='true']");
      const loadingImages = Array.from(document.querySelectorAll("img")).filter(img => !img.complete);
      const loadingIframes = Array.from(document.querySelectorAll("iframe")).filter(iframe => !iframe.complete);
      const pendingFetches = document.querySelectorAll("[aria-busy='true']");
      
      if (spinners.length > 0 || loaders.length > 0 || loadingImages.length > 0 || 
          loadingIframes.length > 0 || pendingFetches.length > 0) {
        // Clear any pending "stop loading" timer
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        setIsLoading(true);
      } else if (!isFirstLoad) {
        // Delay stopping the loader to prevent flickering
        if (!loadingTimerRef.current) {
          loadingTimerRef.current = setTimeout(() => {
            setIsLoading(false);
            loadingTimerRef.current = null;
          }, 300);
        }
      }
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "src", "data-loading", "aria-busy"]
    });

    return () => {
      observer.disconnect();
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [isFirstLoad]);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {/* Always render NProgressLoader but it will hide itself when not loading */}
      <NProgressLoader />
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);