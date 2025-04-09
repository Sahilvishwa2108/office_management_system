import { toast } from "sonner";
import { AxiosError, isAxiosError } from "axios";

export function handleApiError(error: unknown, defaultMessage: string = "An error occurred") {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Handle permission errors (403)
    if (axiosError.response?.status === 403) {
      toast.error((axiosError.response.data as any)?.error || "You don't have permission to perform this action");
      return;
    }
    
    // Handle other common errors
    if (axiosError.response?.data && typeof axiosError.response.data === 'object' && axiosError.response.data !== null && 'error' in axiosError.response.data) {
      toast.error((axiosError.response.data as any).error);
      return;
    }
  }
  
  // Default error message
  toast.error(defaultMessage);
  console.error(error);
}