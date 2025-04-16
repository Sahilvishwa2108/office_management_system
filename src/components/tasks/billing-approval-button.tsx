"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BillingApprovalButtonProps {
  taskId: string;
  taskTitle: string;
  className?: string;
  onApproved?: () => void;
}

export function BillingApprovalButton({
  taskId,
  taskTitle,
  className,
  onApproved,
}: BillingApprovalButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    console.log(`🧾 Approving billing for task ${taskId}`);
    setIsSubmitting(true);
    
    try {
      // Log request details
      console.log(`📤 Sending POST request to /api/tasks/${taskId}/billing-approve`);
      
      const response = await axios.post(`/api/tasks/${taskId}/billing-approve`);
      console.log(`📥 Approval response:`, response.data);
      
      toast.success("Task billing approved successfully");
      setConfirmDialogOpen(false);
      
      // Call the onApproved callback if provided
      if (onApproved) {
        console.log(`🔔 Calling onApproved callback`);
        onApproved();
      } else {
        // Default behavior - redirect to admin dashboard
        console.log(`🔀 Redirecting to admin dashboard`);
        router.push("/dashboard/admin");
        router.refresh();
      }
    } catch (error) {
      console.error("❌ Error approving task billing:", error);
      if (axios.isAxiosError(error)) {
        console.error("❌ Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      toast.error("Failed to approve task billing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={`border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 ${className}`}
        onClick={() => setConfirmDialogOpen(true)}
      >
        <Receipt className="h-4 w-4 mr-2" />
        Approve Billing
      </Button>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Billing</AlertDialogTitle>
            <AlertDialogDescription>
              <p>Are you sure you want to approve this client&apos;s billing?</p>
              <br /><br />
              This will:
              <ul className="list-disc pl-5 mt-2">
                <li>Mark the task as billed</li>
                <li>Add an entry to the client's billing history</li>
                <li>Schedule the task for deletion in 24 hours</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Approving..." : "Approve Billing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}