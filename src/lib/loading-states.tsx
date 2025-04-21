import React, { useState, useCallback } from 'react';

type LoadingState = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

interface UseLoadingStateOptions {
  initialState?: LoadingState;
  successDuration?: number;
}

interface UseLoadingStateResult {
  status: LoadingState;
  isLoading: boolean;
  isRefreshing: boolean;
  isSuccess: boolean;
  isError: boolean;
  startLoading: () => void;
  startRefreshing: () => void;
  setSuccess: () => void;
  setError: () => void;
  reset: () => void;
}

export function useLoadingState({
  initialState = 'idle',
  successDuration = 2000
}: UseLoadingStateOptions = {}): UseLoadingStateResult {
  const [status, setStatus] = useState<LoadingState>(initialState);
  
  const startLoading = useCallback(() => {
    setStatus('loading');
  }, []);
  
  const startRefreshing = useCallback(() => {
    setStatus('refreshing');
  }, []);
  
  const setSuccess = useCallback(() => {
    setStatus('success');
    
    // Automatically reset after successDuration
    if (successDuration > 0) {
      setTimeout(() => {
        setStatus('idle');
      }, successDuration);
    }
  }, [successDuration]);
  
  const setError = useCallback(() => {
    setStatus('error');
  }, []);
  
  const reset = useCallback(() => {
    setStatus('idle');
  }, []);
  
  return {
    status,
    isLoading: status === 'loading',
    isRefreshing: status === 'refreshing',
    isSuccess: status === 'success',
    isError: status === 'error',
    startLoading,
    startRefreshing,
    setSuccess,
    setError,
    reset
  };
}

export function LoadingButton({ 
  status, 
  children, 
  loadingText = 'Loading...',
  refreshingText = 'Refreshing...',
  successText = 'Success!',
  errorText = 'Error!',
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  status: LoadingState;
  loadingText?: string;
  refreshingText?: string;
  successText?: string;
  errorText?: string;
}) {
  return (
    <button
      {...props}
      disabled={status === 'loading' || status === 'refreshing'}
      className={`${props.className || ''} ${status === 'success' ? 'bg-green-600' : status === 'error' ? 'bg-red-600' : ''}`}
    >
      {status === 'loading' ? loadingText :
       status === 'refreshing' ? refreshingText :
       status === 'success' ? successText :
       status === 'error' ? errorText :
       children}
    </button>
  );
}