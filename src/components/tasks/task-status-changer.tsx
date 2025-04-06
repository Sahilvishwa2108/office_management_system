"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  PlayCircle as PlayCircleIcon, 
  AlertCircle as AlertCircleIcon,
  XCircle as XCircleIcon,
  Loader2 as SpinnerIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_STATUSES = [
  { value: "pending", label: "Pending", icon: ClockIcon, color: "text-gray-500" },
  { value: "in-progress", label: "In Progress", icon: PlayCircleIcon, color: "text-blue-500" },
  { value: "review", label: "Under Review", icon: AlertCircleIcon, color: "text-yellow-500" },
  { value: "completed", label: "Completed", icon: CheckCircleIcon, color: "text-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircleIcon, color: "text-red-500" },
];

interface TaskStatusChangerProps {
  taskId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TaskStatusChanger({
  taskId,
  currentStatus,
  onStatusChange,
  disabled = false,
  className,
}: TaskStatusChangerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.patch(`/api/tasks/${taskId}`, {
        status: newStatus
      });
      
      setStatus(newStatus);
      toast.success(`Task status updated to ${getStatusLabel(newStatus)}`);
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      
      // Refresh the page data
      router.refresh();
      
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
      
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusLabel = (statusValue: string): string => {
    return TASK_STATUSES.find(s => s.value === statusValue)?.label || statusValue;
  };
  
  const getStatusIcon = (statusValue: string) => {
    const status = TASK_STATUSES.find(s => s.value === statusValue);
    if (!status) return null;
    
    const Icon = status.icon;
    return <Icon className={cn("h-4 w-4 mr-2", status.color)} />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        disabled={disabled || isSubmitting}
        value={status}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center">
              {getStatusIcon(status)}
              {getStatusLabel(status)}
              {isSubmitting && <SpinnerIcon className="ml-2 h-4 w-4 animate-spin" />}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((statusOption) => (
            <SelectItem key={statusOption.value} value={statusOption.value}>
              <div className="flex items-center">
                <statusOption.icon className={cn("h-4 w-4 mr-2", statusOption.color)} />
                {statusOption.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}