"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  Minus as MediumIcon,
  Loader2 as SpinnerIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_PRIORITIES = [
  { value: "low", label: "Low", icon: ArrowDownIcon, color: "text-green-500" },
  { value: "medium", label: "Medium", icon: MediumIcon, color: "text-yellow-500" },
  { value: "high", label: "High", icon: ArrowUpIcon, color: "text-red-500" },
];

interface TaskPriorityChangerProps {
  taskId: string;
  currentPriority: string;
  onPriorityChange?: (newPriority: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TaskPriorityChanger({
  taskId,
  currentPriority,
  onPriorityChange,
  disabled = false,
  className,
}: TaskPriorityChangerProps) {
  const router = useRouter();
  const [priority, setPriority] = useState(currentPriority);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePriorityChange = async (newPriority: string) => {
    if (newPriority === priority) return;
    
    setIsSubmitting(true);
    
    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        priority: newPriority
      });
      
      setPriority(newPriority);
      toast.success(`Task priority updated to ${getPriorityLabel(newPriority)}`);
      
      if (onPriorityChange) {
        onPriorityChange(newPriority);
      }
      
      // Refresh the page data
      router.refresh();
      
    } catch (error) {
      console.error("Error updating task priority:", error);
      toast.error("Failed to update task priority");
      
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getPriorityLabel = (priorityValue: string): string => {
    return TASK_PRIORITIES.find(p => p.value === priorityValue)?.label || priorityValue;
  };
  
  const getPriorityIcon = (priorityValue: string) => {
    const priority = TASK_PRIORITIES.find(p => p.value === priorityValue);
    if (!priority) return null;
    
    const Icon = priority.icon;
    return <Icon className={cn("h-4 w-4 mr-2", priority.color)} />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        disabled={disabled || isSubmitting}
        value={priority}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue>
            <div className="flex items-center">
              {getPriorityIcon(priority)}
              {getPriorityLabel(priority)}
              {isSubmitting && <SpinnerIcon className="ml-2 h-4 w-4 animate-spin" />}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TASK_PRIORITIES.map((priorityOption) => (
            <SelectItem key={priorityOption.value} value={priorityOption.value}>
              <div className="flex items-center">
                <priorityOption.icon className={cn("h-4 w-4 mr-2", priorityOption.color)} />
                {priorityOption.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}