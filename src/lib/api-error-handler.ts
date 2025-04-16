import { toast } from "sonner";

// Fix multiple instances of 'any' with specific types

export function handleApiError(error: unknown, fallbackMessage: string = "An error occurred") {
  const axiosError = error as { 
    response?: { 
      data?: Record<string, unknown>; 
      status?: number 
    } 
  };
  
  if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'error' in axiosError.response.data) {
    toast.error(axiosError.response.data.error as string);
    return;
  }
  
  toast.error(fallbackMessage);
}