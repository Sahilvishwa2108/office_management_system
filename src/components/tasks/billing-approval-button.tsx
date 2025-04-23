"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, Download } from "lucide-react"; // Add Download icon
import { cn } from "@/lib/utils";
import { generateAndDownloadTaskPdf } from "@/lib/task-pdf-generate"; // Import the PDF generator
import axios from "axios"; // Import axios for fetching comments
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
  className?: string;
  onApproved?: () => void;
  // Add task prop for PDF generation
  task: any;
}

export function BillingApprovalButton({
  taskId,
  className,
  onApproved,
  task, // Add task parameter
}: BillingApprovalButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const router = useRouter();
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const handleApprove = async () => {
    console.log(`🧾 Approving billing for task ${taskId}`);
    setIsSubmitting(true);
    
    try {
      // First generate and download the PDF
      setIsPdfGenerating(true);
      const toastId = toast.loading("Preparing task PDF for records...");
      
      // Fetch the comments for the PDF
      const response = await axios.get(`/api/tasks/${taskId}/comments`);
      const commentData = response.data;
      
      // Generate PDF with fresh comments
      await generateAndDownloadTaskPdf(task, commentData);
      
      toast.success("PDF generated and downloaded", { id: toastId });
      setIsPdfGenerating(false);
      
      // Then proceed with billing approval
      const approvalResponse = await fetch(`/api/tasks/${taskId}/billing-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        throw new Error(errorData.error || "Failed to approve billing");
      }

      // Success handling
      const data = await approvalResponse.json();
      console.log("Billing approved successfully:", data);
      
      // Call the onApproved callback if provided
      if (onApproved) {
        onApproved();
      }
      
      // Close the dialog
      setConfirmDialogOpen(false);
      
      // Redirect to the tasks page after successful billing approval
      router.push('/dashboard/tasks');
      
    } catch (error) {
      console.error("Error in approval process:", error);
      toast.error("Error in approval process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "flex items-center gap-1 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800",
          className
        )}
        onClick={() => setConfirmDialogOpen(true)}
        disabled={isSubmitting}
      >
        <Receipt className="h-4 w-4" />
        Approve Billing
      </Button>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Billing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this client's billing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-2">
            <div className="mb-2">This will:</div>
            <ul className="list-disc pl-5">
              <li>Generate and download a PDF record of this task</li>
              <li>Mark the task as billed</li>
              <li>Add an entry to the client's billing history</li>
              <li>Delete the task immediately</li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting || isPdfGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting || isPdfGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPdfGenerating ? "Generating PDF..." : "Processing..."}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Confirm & Download
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}