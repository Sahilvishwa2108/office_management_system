import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { clientBrowserCache } from '@/lib/browser-cache';

interface OptimisticMutationOptions<T, U> {
  onMutate?: (data: U) => T; // Transform input to optimistic update
  onSuccess?: (data: any) => void;
  onError?: (error: any, rollbackData: T | null) => void;
  onSettled?: () => void;
  invalidateQueries?: string[]; // Cache keys to invalidate on success
}

export function useOptimisticMutation<T, U = any>(
  url: string,
  options: OptimisticMutationOptions<T, U> & Omit<AxiosRequestConfig, 'url' | 'data'> = {}
) {
  const {
    onMutate,
    onSuccess,
    onError,
    onSettled,
    invalidateQueries = [],
    ...axiosConfig
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: U) => {
    setIsLoading(true);
    setError(null);
    
    // Store original data for rollback
    let originalData: T | null = null;
    
    // Apply optimistic update if defined
    if (onMutate) {
      try {
        originalData = onMutate(data);
      } catch (err) {
        console.error('Error applying optimistic update:', err);
      }
    }
    
    try {
      // Make the actual API call
      const response = await axios({
        url,
        method: 'POST', // Default to POST
        data,
        ...axiosConfig,
      });
      
      // Invalidate cached queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          if (queryKey.includes('*')) {
            // Handle wildcard invalidation by clearing cache with prefix
            const prefix = queryKey.replace('*', '');
            // This is a simplified approach - you might need a more complex invalidation strategy
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
              }
            });
          } else {
            // Clear specific cache item
            clientBrowserCache.delete(queryKey);
          }
        });
      }
      
      onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      setError(err as Error);
      onError?.(err, originalData);
      throw err;
    } finally {
      setIsLoading(false);
      onSettled?.();
    }
  }, [url, axiosConfig, onMutate, onSuccess, onError, onSettled, invalidateQueries]);

  return {
    mutate,
    isLoading,
    error,
  };
}