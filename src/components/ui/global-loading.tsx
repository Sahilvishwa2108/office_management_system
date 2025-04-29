"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      
      // Safety timeout - never show loading for more than 8 seconds
      const safetyTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 8000);
      
      return () => clearTimeout(safetyTimeout);
    } else {
      // Once session status is determined, hide the loader with a short delay
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
      }, 600); // Reduced from 800ms for a snappier feel
      
      // Update the ref with current pathname
      previousPathRef.current = pathname;
      
      return () => clearTimeout(timer);
    }
  }, [pathname, status]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          <div className="relative flex flex-col items-center">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute -right-32 -top-32 w-64 h-64 rounded-full bg-pink-500/5 dark:bg-pink-500/10 blur-3xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.4, 0.3],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              />
              <motion.div 
                className="absolute -left-32 -bottom-32 w-64 h-64 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.5
                }}
              />
            </div>
            
            {/* Logo container */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
            >
              {/* Logo gradient background */}
              <motion.div 
                className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-lg opacity-30"
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              {/* Icon with gradient background */}
              <motion.div
                className="relative z-10 h-16 w-16 rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center"
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <Building2 className="h-8 w-8 text-white" />
              </motion.div>
            </motion.div>
            
            {/* Progress indicators */}
            <div className="mt-8 flex space-x-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ scale: 0.8, opacity: 0.4 }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}