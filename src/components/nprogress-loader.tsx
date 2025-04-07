"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";

export function NProgressLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const requestInterceptorId = useRef<number | null>(null);
  const responseInterceptorId = useRef<number | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Track active requests to handle multiple concurrent requests
  const activeRequestsRef = useRef<number>(0);
  
  useEffect(() => {
    let animationFrame: number | undefined;
    
    const handleStart = () => {
      setLoading(true);
      setProgress(0);
      setError(false);
      
      // Clear any existing interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      // Use a more consistent linear animation approach
      let startTime = Date.now();
      const totalDuration = 3000; // 3 seconds to reach 90%
      
      progressInterval.current = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = Math.min((elapsedTime / totalDuration) * 90, 90);
        
        setProgress(newProgress);
        
        if (newProgress >= 90) {
          clearInterval(progressInterval.current!);
        }
      }, 16); // ~60fps for smoother animation
    };
    
    const handleComplete = (isError = false) => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      setError(isError);
      // Quick progress to 100% for a smooth finish
      setProgress(100);
      
      // Fade out after reaching 100%
      const fadeOutTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setError(false);
      }, isError ? 1000 : 200);
      
      return () => clearTimeout(fadeOutTimer);
    };

    // Only set up interceptors when session is ready
    if (sessionStatus !== 'loading') {
      // Clean up any existing interceptors
      if (requestInterceptorId.current !== null) {
        axios.interceptors.request.eject(requestInterceptorId.current);
      }
      if (responseInterceptorId.current !== null) {
        axios.interceptors.response.eject(responseInterceptorId.current);
      }
      
      // Set up axios interceptors with auth token
      requestInterceptorId.current = axios.interceptors.request.use(config => {
        // Add auth header from session if available
        if (sessionStatus === 'authenticated' && config.headers) {
          // You can get the token from localStorage, cookies, or session context
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        activeRequestsRef.current++;
        if (activeRequestsRef.current === 1) {
          handleStart();
        }
        return config;
      }, error => {
        activeRequestsRef.current--;
        if (activeRequestsRef.current === 0) {
          handleComplete(true);
        }
        return Promise.reject(error);
      });
      
      responseInterceptorId.current = axios.interceptors.response.use(
        response => {
          activeRequestsRef.current--;
          if (activeRequestsRef.current === 0) {
            handleComplete(false);
          }
          return response;
        },
        error => {
          activeRequestsRef.current--;
          if (activeRequestsRef.current === 0) {
            handleComplete(true);
          }
          return Promise.reject(error);
        }
      );
    }
    
    // Handle route changes for Next.js navigation
    handleStart();
    const timeout = setTimeout(() => {
      handleComplete();
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      // Remove axios interceptors
      if (requestInterceptorId.current !== null) {
        axios.interceptors.request.eject(requestInterceptorId.current);
        requestInterceptorId.current = null;
      }
      if (responseInterceptorId.current !== null) {
        axios.interceptors.response.eject(responseInterceptorId.current);
        responseInterceptorId.current = null;
      }
    };
  }, [pathname, searchParams, sessionStatus]);
  
  if (!loading && progress === 0) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center items-center">
      {/* Center origin container */}
      <div className="w-full h-1 flex justify-center relative">
        {/* Left side of the progress bar (expands leftward from center) */}
        <div 
          className={`h-1 absolute top-0 right-1/2 origin-right transform transition-transform ease-out duration-300 ${error ? 'bg-red-500' : ''}`}
          style={{ 
            width: '50%',
            transform: `scaleX(${progress / 100})`,
            background: error 
              ? 'linear-gradient(to left, #f43f5e, transparent)'
              : 'linear-gradient(to left, var(--primary), transparent)',
            boxShadow: error 
              ? '0 0 10px rgba(239, 68, 68, 0.7)'
              : '0 0 10px rgba(var(--primary), 0.7)'
          }}
        />
        
        {/* Right side of the progress bar (expands rightward from center) */}
        <div 
          className={`h-1 absolute top-0 left-1/2 origin-left transform transition-transform ease-out duration-300 ${error ? 'bg-red-500' : ''}`}
          style={{ 
            width: '50%',
            transform: `scaleX(${progress / 100})`,
            background: error 
              ? 'linear-gradient(to right, #f43f5e, transparent)'
              : 'linear-gradient(to right, var(--primary), transparent)',
            boxShadow: error 
              ? '0 0 10px rgba(239, 68, 68, 0.7)'
              : '0 0 10px rgba(var(--primary), 0.7)'
          }}
        />
        
        {/* Center pulsing point */}
        <div 
          className="h-3 w-3 rounded-full absolute top-[-1px] left-1/2 transform -translate-x-1/2 animate-pulse z-10"
          style={{ 
            background: error ? '#ef4444' : 'var(--primary)',
            boxShadow: error 
              ? '0 0 10px 3px #ef4444'
              : '0 0 10px 3px var(--primary)'
          }}
        />
      </div>
    </div>
  );
}