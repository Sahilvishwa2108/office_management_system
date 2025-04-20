"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle,
  Clock,
  PlayCircle, 
  AlertCircle,
  XCircle,
  Loader2,
  Receipt,
  LockIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-gray-500" },
  { value: "in_progress", label: "In Progress", icon: PlayCircle, color: "text-blue-500" },
  { value: "review", label: "Under Review", icon: AlertCircle, color: "text-yellow-500" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "text-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-500" },
];

interface TaskStatusChangerProps {
  taskId: string;
  currentStatus: string;
  billingStatus?: string;
  clientId?: string | null;
  isGuestClient?: boolean;
  userRole?: string;
  onStatusChange?: (newStatus: string, newBillingStatus?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TaskStatusChanger({
  taskId,
  currentStatus,
  billingStatus = "not_billed",
  clientId,
  isGuestClient = false,
  userRole = "BUSINESS_EXECUTIVE",
  onStatusChange,
  disabled = false,
  className,
}: TaskStatusChangerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pendingBilling, setPendingBilling] = useState(billingStatus === "pending_billing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = userRole === "ADMIN";

  // Check if task is locked due to billing
  const isTaskLocked = billingStatus === "billed";

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.patch(`/api/tasks/${taskId}/status`, {
        status: newStatus
      });
      
      setStatus(newStatus);
      
      // Check if response includes a billingStatus field update
      if (response.data.billingStatus === "pending_billing") {
        setPendingBilling(true);
        toast.success(`Task marked as completed and pending billing`);
      } else {
        toast.success(`Task status updated to ${getStatusLabel(newStatus)}`);
      }
      
      if (onStatusChange) {
        onStatusChange(newStatus, response.data.billingStatus);
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
    // For "completed" tasks that are pending billing, show a receipt icon
    if (statusValue === "completed" && billingStatus === "pending_billing") {
      return <Receipt className="h-4 w-4 mr-2 text-amber-500" />;
    } else if (statusValue === "completed" && billingStatus === "billed") {
      return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
    }
    
    const status = TASK_STATUSES.find(s => s.value === statusValue);
    if (!status) return null;
    
    const Icon = status.icon;
    return <Icon className={cn("h-4 w-4 mr-2", status.color)} />;
  };

  const getDisplayStatus = () => {
    // If completed and pending billing, prioritize showing the billing status
    if (status === "completed" && billingStatus === "pending_billing") {
      return "Pending Billing";
    } else if (status === "completed" && billingStatus === "billed") {
      return "Completed & Billed";
    }
    
    return getStatusLabel(status);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        disabled={disabled || isSubmitting || pendingBilling || isTaskLocked}
        value={status}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className={cn("w-[180px]", pendingBilling && "bg-amber-50 text-amber-800 border-amber-300")}>
          <SelectValue>
            <div className="flex items-center">
              {getStatusIcon(status)}
              {getDisplayStatus()}
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
      
      {/* Add a visual indicator when task is locked */}
      {isTaskLocked && (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
          <LockIcon className="h-3 w-3 mr-1" />
          Locked
        </Badge>
      )}
      
      {clientId && (
        <p className="text-xs text-muted-foreground">Client: {clientId}</p>
      )}
      {isGuestClient && (
        <Badge variant="outline" className="text-xs">Guest Client</Badge>
      )}
      {isAdmin && (
        <div className="admin-controls">
          {/* Admin-specific controls */}
        </div>
      )}
    </div>
  );
}