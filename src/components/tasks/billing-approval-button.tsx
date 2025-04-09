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
            <DialogTitle>Approve Billing</DialogTitle>
            <DialogDescription>
              This will permanently delete all task comments and discussions, 
              and move the task details to client history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="font-medium">Task: {taskTitle}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Task comments and attachments will be permanently deleted
              to optimize database storage. Only the task details will be
              preserved in client history.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm Billing</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}