import { prisma } from "@/lib/prisma";
// Remove or comment this import since it's causing errors
// import { sendWhatsAppMessage } from './email';

interface NotificationOptions {
  title: string;
  content: string;
  sentById: string;
  sentToId: string;
  sendEmail?: boolean;
  emailSubject?: string;
  emailHtml?: string;
  sendWhatsApp?: boolean;
  whatsAppMessage?: string;
}

export async function createNotification({
  title,
  content,
  sentById,
  sentToId,
  sendEmail = false,
  emailSubject,
  emailHtml,
  sendWhatsApp = false,
  whatsAppMessage,
}: NotificationOptions) {
  try {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        sentById,
        sentToId,
      },
      include: {
        sentTo: true,
      },
    });

    // Send email if requested
    if (sendEmail && notification.sentTo.email) {
      // Email implementation would go here
      // For example:
      // await sendEmail({
      //   to: notification.sentTo.email,
      //   subject: emailSubject || title,
      //   html: emailHtml || `<p>${content}</p>`,
      // });
    }

    // Send WhatsApp message if requested - CURRENTLY DISABLED
    if (sendWhatsApp && notification.sentTo.phone) {
      // WhatsApp implementation would go here
      // Currently disabled pending implementation
      console.log('WhatsApp notification would be sent to:', notification.sentTo.phone);
      
      // Comment out or remove this call since the function is not implemented
      // await sendWhatsAppMessage({
      //   to: notification.sentTo.phone,
      //   message: whatsAppMessage || content
      // });
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

// Rest of your notification functions remain unchanged
export async function sendTaskAssignedNotification(
  taskId: string,
  taskTitle: string,
  assignerUserId: string,
  assigneeUserId: string,
  note?: string,
  dueDate?: Date
) {
  try {
    // Get user details
    const [assigner, assignee] = await Promise.all([
      prisma.user.findUnique({ where: { id: assignerUserId } }),
      prisma.user.findUnique({ where: { id: assigneeUserId } })
    ]);

    if (!assigner || !assignee) {
      throw new Error("User not found");
    }

    // Create notification
    const notificationContent = `${assigner.name} assigned you a task: ${taskTitle}${
      note ? ` - Note: ${note}` : ""
    }`;

    const emailHtml = getTaskAssignmentTemplate(
      taskTitle,
      assigner.name,
      note,
      dueDate
    );

    await createNotification({
      title: "New Task Assigned",
      content: notificationContent,
      sentById: assignerUserId,
      sentToId: assigneeUserId,
      sendEmail: true,
      emailSubject: `Task Assigned: ${taskTitle}`,
      emailHtml,
      sendWhatsApp: !!assignee.phone,
      whatsAppMessage: notificationContent,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "assigned",
        target: taskTitle,
        details: { taskId },
        userId: assignerUserId,
      },
    });
  } catch (error) {
    console.error("Failed to send task assignment notification:", error);
  }
}

export async function sendTaskReassignedNotification(
  taskId: string,
  taskTitle: string,
  reassignerUserId: string,
  previousAssigneeId: string | null,
  newAssigneeId: string
) {
  try {
    // Get user details
    const [reassigner, newAssignee] = await Promise.all([
      prisma.user.findUnique({ where: { id: reassignerUserId } }),
      prisma.user.findUnique({ where: { id: newAssigneeId } })
    ]);

    if (!reassigner || !newAssignee) {
      throw new Error("User not found");
    }

    // Notify new assignee
    const newAssigneeNotification = `${reassigner.name} assigned you a task: ${taskTitle}`;
    
    await createNotification({
      title: "Task Assigned",
      content: newAssigneeNotification,
      sentById: reassignerUserId,
      sentToId: newAssigneeId,
      sendEmail: true,
      emailSubject: `Task Assigned: ${taskTitle}`,
      emailHtml: getTaskAssignmentTemplate(taskTitle, reassigner.name),
      sendWhatsApp: !!newAssignee.phone,
      whatsAppMessage: newAssigneeNotification,
    });

    // If there was a previous assignee, notify them as well
    if (previousAssigneeId && previousAssigneeId !== newAssigneeId) {
      const previousAssignee = await prisma.user.findUnique({
        where: { id: previousAssigneeId }
      });

      if (previousAssignee) {
        const previousAssigneeNotification = `Your task "${taskTitle}" has been reassigned to ${newAssignee.name}`;
        
        await createNotification({
          title: "Task Reassigned",
          content: previousAssigneeNotification,
          sentById: reassignerUserId,
          sentToId: previousAssigneeId,
          sendEmail: true,
          emailSubject: `Task Reassigned: ${taskTitle}`,
          emailHtml: getTaskReassignedTemplate(taskTitle, newAssignee.name),
          sendWhatsApp: !!previousAssignee.phone,
          whatsAppMessage: previousAssigneeNotification,
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "reassigned",
        target: taskTitle,
        details: {
          taskId,
          previousAssigneeId,
          newAssigneeId,
        },
        userId: reassignerUserId,
      },
    });
  } catch (error) {
    console.error("Failed to send task reassignment notification:", error);
  }
}

export async function sendTaskStatusUpdateNotification(
  taskId: string,
  taskTitle: string,
  updaterUserId: string,
  creatorUserId: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    // Skip notification if updater is also the creator
    if (updaterUserId === creatorUserId) {
      return;
    }

    // Get user details
    const [updater, creator] = await Promise.all([
      prisma.user.findUnique({ where: { id: updaterUserId } }),
      prisma.user.findUnique({ where: { id: creatorUserId } }),
    ]);

    if (!updater || !creator) {
      throw new Error("User not found");
    }

    // Create notification
    const notificationTitle = "Task Status Updated";
    const notificationContent = `${updater.name} changed task "${taskTitle}" status from ${oldStatus} to ${newStatus}`;

    // Email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Task Status Updated</h2>
        <p><strong>Task:</strong> ${taskTitle}</p>
        <p><strong>Status change:</strong> ${oldStatus} → ${newStatus}</p>
        <p><strong>Updated by:</strong> ${updater.name}</p>
        <p>Log in to the system to view task details.</p>
        <p>Thank you,<br>Office Management Team</p>
      </div>
    `;

    await createNotification({
      title: notificationTitle,
      content: notificationContent,
      sentById: updaterUserId,
      sentToId: creatorUserId,
      sendEmail: true,
      emailSubject: `Task Status Update: ${taskTitle}`,
      emailHtml,
      sendWhatsApp: !!creator.phone,
      whatsAppMessage: notificationContent,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "task",
        action: "status_changed",
        target: taskTitle,
        details: {
          taskId,
          oldStatus,
          newStatus,
        },
        userId: updaterUserId,
      },
    });
  } catch (error) {
    console.error("Failed to send task status update notification:", error);
  }
}