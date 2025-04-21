import { toast } from "sonner";

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
      details?: Record<string, unknown>;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  name?: string;
  code?: string;
}

export function handleApiError(
  error: unknown, 
  options: {
    fallbackMessage?: string;
    showToast?: boolean;
    logToConsole?: boolean;
  } = {}
): {
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
} {
  const {
    fallbackMessage = "An error occurred",
    showToast = true,
    logToConsole = true
  } = options;
  
  // Default error response
  const errorResponse = {
    message: fallbackMessage,
    statusCode: undefined as number | undefined,
    details: undefined as Record<string, unknown> | undefined
  };
  
  // Cast the error to our ApiError type
  const apiError = error as ApiError;
  
  if (apiError?.response?.data) {
    // Handle structured API errors
    const errorData = apiError.response.data;
    errorResponse.statusCode = apiError.response.status;
    
    if (typeof errorData.error === 'string') {
      errorResponse.message = errorData.error;
    } else if (typeof errorData.message === 'string') {
      errorResponse.message = errorData.message;
    }
    
    if (errorData.details) {
      errorResponse.details = errorData.details;
    }
  } else if (apiError?.message) {
    // Handle generic JS errors or network errors
    errorResponse.message = apiError.message;
    
    // Add more specific handling for network errors
    if (apiError.code === 'ECONNABORTED') {
      errorResponse.message = 'Request timed out. Please try again.';
    } else if (apiError.name === 'NetworkError' || apiError.message.includes('Network Error')) {
      errorResponse.message = 'Network connection error. Please check your internet connection.';
    }
  }
  
  // Log to console if enabled
  if (logToConsole) {
    console.error('API Error:', error);
  }
  
  // Show toast notification if enabled
  if (showToast) {
    toast.error(errorResponse.message);
  }
  
  return errorResponse;
}