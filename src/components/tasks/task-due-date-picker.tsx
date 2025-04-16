"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, X as XIcon, Loader2 as SpinnerIcon } from "lucide-react";

interface TaskDueDatePickerProps {
  taskId: string;
  currentDueDate: Date | string | null;
  onDateChange?: (newDate: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

export function TaskDueDatePicker({
  taskId,
  currentDueDate,
  onDateChange,
  disabled = false,
  className,
}: TaskDueDatePickerProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(currentDueDate ? new Date(currentDueDate) : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDateChange = async (newDate: Date | null) => {
    setDate(newDate);
    setOpen(false);
    
    setIsSubmitting(true);
    
    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        dueDate: newDate ? newDate.toISOString() : null,
      });
      
      if (onDateChange) {
        onDateChange(newDate);
      }
      
      toast.success(newDate ? `Due date set to ${format(newDate, "PPP")}` : "Due date removed");
      
      // Refresh the page data
      router.refresh();
      
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date");
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDate = () => {
    handleDateChange(null);
  };

  const isOverdue = () => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || isSubmitting}
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              isSubmitting && "opacity-50 cursor-not-allowed",
              isOverdue() && "text-red-500 border-red-200"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span className="text-muted-foreground">No due date</span>}
            {isSubmitting && <SpinnerIcon className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(day) => handleDateChange(day || null)}
            disabled={disabled || isSubmitting}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {date && !isSubmitting && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRemoveDate}
          disabled={disabled}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Remove due date</span>
        </Button>
      )}
    </div>
  );
}