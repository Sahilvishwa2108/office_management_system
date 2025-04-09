"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Receipt, Loader2 } from "lucide-react";

interface BillingApprovalButtonProps {
  taskId: string;
  taskTitle: string;
  className?: string;
}

export function BillingApprovalButton({
  taskId,
  taskTitle,
  className,
}: BillingApprovalButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    
    try {
      await axios.post(`/api/tasks/${taskId}/billing-approve`);
      
      toast.success("Task billing approved successfully");
      setConfirmDialogOpen(false);
      
      // After successful billing approval, redirect to the admin dashboard
      router.push("/dashboard/admin");
      router.refresh();
    } catch (error) {
      console.error("Error approving task billing:", error);
      toast.error("Failed to approve task billing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline"
        className={`bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 ${className}`}
        onClick={() => setConfirmDialogOpen(true)}
      >
        <Receipt className="mr-2 h-4 w-4" />
        Approve Billing
      </Button>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Task Billing</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve the billing for "{taskTitle}"?
              <br /><br />
              <strong>This will:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li>Mark this task as billed</li>
                <li>Move this task to client history</li>
                <li>Remove the task from active tasks</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Approval"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}