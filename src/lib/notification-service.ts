import { prisma } from "@/lib/prisma";
import { sendActivityNotificationEmail } from "@/lib/email";

interface NotificationOptions {
  title: string;
  content: string;
  recipientId: string;
  senderId: string;
  shouldSendEmail?: boolean;
  emailTemplate?: string;
}

/**
 * Creates a notification and optionally sends an email
 */
export async function createNotification({
  title,
  content,
  recipientId,
  senderId,
  shouldSendEmail = false,
  emailTemplate = "notification",
}: NotificationOptions): Promise<void> {
  try {
    // Get the recipient to check email
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, name: true }
    });
    
    if (!recipient) {
      console.error(`Failed to create notification: Recipient ${recipientId} not found`);
      return;
    }

    // Create notification in database
    await prisma.notification.create({
      data: {
        title,
        content,
        sentById: senderId,
        sentToId: recipientId,
      },
    });
    
    // Send email if requested
    if (shouldSendEmail && recipient.email) {
      // Use the specific email function directly
      await sendActivityNotificationEmail(
        recipient.email,
        recipient.name,
        title,
        content,
        emailTemplate
      );
    }
  } catch (error) {
    console.error("Failed to create notification or send email:", error);
    // Don't throw - notification/email failure shouldn't break the main functionality
  }
}

/**
 * Process activity and create notifications for relevant users
 */
export async function processActivityNotifications({
  activityId,
  type,
  action,
  target,
  details,
  actorId,
  relatedUserIds = []
}: {
  activityId: string;
  type: string;
  action: string;
  target: string;
  details?: any;
  actorId: string;
  relatedUserIds?: string[];
}): Promise<void> {
  console.log("==== NOTIFICATION PROCESS STARTED ====");
  console.log(`Activity ID: ${activityId}, Type: ${type}, Action: ${action}`);
  console.log(`Actor ID: ${actorId}, Related Users:`, relatedUserIds);
  
  try {
    // Get actor details
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true, email: true }
    });
    
    if (!actor) {
      console.error(`Actor not found: ${actorId}`);
      return;
    }
    
    console.log(`Actor found: ${actor.name} (${actor.email})`);
    
    // Create notification title and content
    let title = "";
    let content = "";
    
    switch(type) {
      case "user":
        title = `User ${action}`;
        content = `${actor.name} ${action} user "${target}"`;
        break;
      case "task":
        title = `Task ${action}`;
        content = `${actor.name} ${action} task "${target}"`;
        break;
      case "client":
        title = `Client ${action}`;
        content = `${actor.name} ${action} client "${target}"`;
        break;
      case "document":
        title = `Document ${action}`;
        content = `${actor.name} ${action} document "${target}"`;
        break;
      case "message":
        title = `New message`;
        content = `${actor.name} sent a message: "${target}"`;
        break;
      default:
        title = `Activity update`;
        content = `${actor.name} performed action on "${target}"`;
    }
    
    console.log(`Notification content prepared: "${title}" - ${content}`);
    
    // Skip if no related users
    if (relatedUserIds.length === 0) {
      console.log("No related users found for notification. Exiting.");
      return;
    }
    
    // Filter out the actor from recipients and get unique IDs
    const uniqueRecipientIds = [...new Set(relatedUserIds)].filter(id => id !== actorId);
    console.log(`Filtered recipients: ${uniqueRecipientIds.length} users`);
    
    if (uniqueRecipientIds.length === 0) {
      console.log("No recipients left after filtering. Exiting.");
      return;
    }
    
    // Fetch recipients
    const recipients = await prisma.user.findMany({
      where: { 
        id: { in: uniqueRecipientIds },
        isActive: true
      },
      select: { id: true, email: true, name: true }
    });
    
    console.log(`Found ${recipients.length} active recipients`);
    
    if (recipients.length === 0) {
      console.log("No active recipients found. Exiting.");
      return;
    }
    
    // Log each recipient
    recipients.forEach(r => {
      console.log(`Recipient: ${r.name} (${r.email})`);
    });
    
    // Process notifications one by one with extensive logging
    for (const recipient of recipients) {
      try {
        console.log(`Creating notification for ${recipient.name}...`);
        
        // Create notification
        const notification = await prisma.notification.create({
          data: {
            title,
            content,
            sentById: actorId,
            sentToId: recipient.id
          }
        });
        
        console.log(`Notification created with ID: ${notification.id}`);
        
        // Send email
        console.log(`Sending email to ${recipient.email}...`);
        const emailResult = await sendActivityNotificationEmail(
          recipient.email,
          recipient.name,
          title,
          content,
          type
        );
        
        if (emailResult.success) {
          console.log(`Email sent successfully to ${recipient.email}`);
        } else {
          console.error(`Failed to send email to ${recipient.email}:`, emailResult.error);
        }
      } catch (notificationError) {
        console.error(`Error processing notification for ${recipient.id}:`, notificationError);
      }
    }
    
    console.log("==== NOTIFICATION PROCESS COMPLETED ====");
    
  } catch (error) {
    console.error("==== NOTIFICATION PROCESS FAILED ====");
    console.error("Error details:", error);
  }
}