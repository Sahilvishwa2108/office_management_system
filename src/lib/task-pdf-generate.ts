import jsPDF from "jspdf";
import { format } from "date-fns";
import { toast } from "sonner";

interface TaskForPdf {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  billingStatus?: string;
  assignedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  assignees: Array<{
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
  client: {
    id: string;
    contactPerson: string;
    companyName: string | null;
  } | null;
}

interface CommentForPdf {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function generateAndDownloadTaskPdf(
  task: TaskForPdf,
  comments: CommentForPdf[]
) {
  try {
    // Show loading toast
    const toastId = toast.loading("Generating PDF...");

    // Create PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add company name or logo at the top
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.text("TASK DETAILS", 105, 15, { align: "center" });

    // Add horizontal line
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.line(20, 20, 190, 20);

    // Task title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(task.title, 20, 30);

    // Task status and priority
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Format status and priority to be more readable
    const formatField = (str: string) => {
      return str
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    doc.setFont("helvetica", "bold");
    doc.text("Status:", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(formatField(task.status), 40, 40);

    doc.setFont("helvetica", "bold");
    doc.text("Priority:", 70, 40);
    doc.setFont("helvetica", "normal");
    doc.text(formatField(task.priority), 90, 40);

    // Due date if exists
    if (task.dueDate) {
      doc.setFont("helvetica", "bold");
      doc.text("Due Date:", 130, 40);
      doc.setFont("helvetica", "normal");
      doc.text(format(new Date(task.dueDate), "MMM dd, yyyy"), 160, 40);
    }

    // Task description
    doc.setFont("helvetica", "bold");
    doc.text("Description:", 20, 50);
    doc.setFont("helvetica", "normal");

    // Handle multiline description with wrapping
    const description = task.description || "No description provided";
    const splitDescription = doc.splitTextToSize(description, 160);
    doc.text(splitDescription, 20, 55);

    // Calculate y position after description
    let yPos = 55 + splitDescription.length * 5;
    yPos = Math.max(yPos, 70); // Ensure minimum spacing

    // Task metadata section
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    // Assigned by
    doc.setFont("helvetica", "bold");
    doc.text("Assigned By:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(task.assignedBy.name, 70, yPos);
    yPos += 7;

    // Assigned to
    doc.setFont("helvetica", "bold");
    doc.text("Assigned To:", 20, yPos);
    doc.setFont("helvetica", "normal");

    if (task.assignees && task.assignees.length > 0) {
      const assigneeNames = task.assignees.map((a) => a.user.name).join(", ");
      doc.text(assigneeNames, 70, yPos);
    } else {
      doc.text("Unassigned", 70, yPos);
    }
    yPos += 7;

    // Client information if exists
    if (task.client) {
      doc.setFont("helvetica", "bold");
      doc.text("Client:", 20, yPos);
      doc.setFont("helvetica", "normal");
      let clientText = task.client.contactPerson;
      if (task.client.companyName) {
        clientText += ` (${task.client.companyName})`;
      }
      doc.text(clientText, 70, yPos);
      yPos += 7;
    }

    // Created and updated dates
    doc.setFont("helvetica", "bold");
    doc.text("Created:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(task.createdAt), "MMM dd, yyyy"), 70, yPos);
    yPos += 7;

    // Billing status if exists
    if (task.billingStatus) {
      doc.setFont("helvetica", "bold");
      doc.text("Billing Status:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(formatField(task.billingStatus), 70, yPos);
      yPos += 7;
    }

    // Comments section
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Comments", 20, yPos);
    yPos += 5;

    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    if (comments && comments.length > 0) {
      doc.setFontSize(10);

      comments.forEach((comment) => {
        // Check if we need a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        // Comment header with user and date
        doc.setFont("helvetica", "bold");
        doc.text(
          `${comment.user.name} • ${format(
            new Date(comment.createdAt),
            "MMM dd, yyyy h:mm a"
          )}`,
          20,
          yPos
        );
        yPos += 5;

        // Comment content
        doc.setFont("helvetica", "normal");
        const commentLines = doc.splitTextToSize(comment.content, 160);
        doc.text(commentLines, 20, yPos);
        yPos += commentLines.length * 1 + 5;

        // Add separator between comments
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.text("No comments yet", 20, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Generated on ${format(
          new Date(),
          "MMM dd, yyyy h:mm a"
        )} • Page ${i} of ${pageCount}`,
        105,
        290,
        { align: "center" }
      );
    }

    // Trigger download
    // Fix the filename generation section:

    // Trigger download
    const pdfBlob = doc.output("blob");
    
    // Generate filename
    const currentDate = format(new Date(), "yyyy-MM-dd");

    // Get client name or "no-client"
    const clientName = task.client
      ? (task.client.companyName || task.client.contactPerson || "no-client")
      : "no-client";

    // Create the filename in a URL-friendly format
    const safeTaskName = task.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const safeClientName = clientName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const fileName = `${safeTaskName}-${safeClientName}-${currentDate}.pdf`;

    // Create download link and trigger it
    const link = document.createElement("a");
    link.href = URL.createObjectURL(pdfBlob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    // Show success toast
    toast.success("PDF downloaded successfully", {
      id: toastId,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
}
