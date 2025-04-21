import { useState, useEffect } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { BrowserCache, clientBrowserCache } from '@/lib/browser-cache';

interface UseCachedFetchOptions {
  cacheTtl?: number; // Cache time-to-live in seconds
  cache?: BrowserCache; // Custom cache instance
  enabled?: boolean; // Whether to execute the fetch automatically
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useCachedFetch<T = any>(
  url: string,
  options: UseCachedFetchOptions & AxiosRequestConfig = {}
) {
  const {
    cacheTtl = 300, // Default 5 minutes
    cache = clientBrowserCache,
    enabled = true,
    onSuccess,
    onError,
    ...axiosConfig
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Generate a cache key based on the URL and any query parameters
  const cacheKey = `fetch:${url}:${JSON.stringify(axiosConfig.params || {})}`;

  // Fetch data function
  const fetchData = async (ignoreCache = false) => {
    // If ignoreCache is true, we're refreshing data
    const loadingState = ignoreCache ? setIsRefreshing : setIsLoading;
    loadingState(true);
    setError(null);

    try {
      // Try to get from cache first (unless ignoreCache is true)
      if (!ignoreCache) {
        const cachedData = cache.get<T>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
          onSuccess?.(cachedData);
          return;
        }
      }

      // If no cached data or we're ignoring cache, fetch from API
      const response = await axios(url, axiosConfig);
      const fetchedData = response.data;

      // Update state with fetched data
      setData(fetchedData);

      // Store in cache
      cache.set<T>(cacheKey, fetchedData, cacheTtl);

      // Call onSuccess callback if provided
      onSuccess?.(fetchedData);
    } catch (err) {
      setError(err as Error);
      onError?.(err);
    } finally {
      loadingState(false);
    }
  };

  // Execute the fetch when the component mounts or when dependencies change
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [url, JSON.stringify(axiosConfig.params)]);

  // Return fetch state and controls
  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh: () => fetchData(true), // Force refresh from API
    mutate: (newData: T) => {
      setData(newData);
      cache.set<T>(cacheKey, newData, cacheTtl);
    }
  };
}