import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, X, Receipt } from "lucide-react";

interface TaskStatusBadgeProps {
  status: string;
  billingStatus?: string;
}

export function TaskStatusBadge({ 
  status, 
  billingStatus = "not_billed"
}: TaskStatusBadgeProps) {
  console.log(`🏷️ Rendering TaskStatusBadge: status=${status}, billingStatus=${billingStatus}`);
  
  // If completed and pending billing, show special status
  if (status === "completed" && billingStatus === "pending_billing") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
        <Receipt className="h-3.5 w-3.5" />
        <span>Pending for Billing</span>
      </Badge>
    );
  }
  
  // If completed and billed, show completed with billing indication
  if (status === "completed" && billingStatus === "billed") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>Completed & Billed</span>
      </Badge>
    );
  }

  // Otherwise, show standard statuses
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending</span>
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>In Progress</span>
        </Badge>
      );
    case "review":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Under Review</span>
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Completed</span>
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
          <X className="h-3.5 w-3.5" />
          <span>Cancelled</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
}