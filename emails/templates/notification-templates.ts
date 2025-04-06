export function getActivityIcon(activityType: string): string {
  switch(activityType) {
    case 'user': return "👤";
    case 'task': return "✅";
    case 'client': return "🏢";
    case 'document': return "📄";
    case 'message': return "💬";
    default: return "📝";
  }
}

export function getActivityNotificationTemplate(
  name: string, 
  activityTitle: string, 
  activityDetails: string, 
  activityIcon: string, 
  dashboardUrl: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>${activityIcon} Activity Update</h2>
      <p>Hello ${name},</p>
      <p><strong>${activityTitle}</strong></p>
      <p>${activityDetails}</p>
      <div style="margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          View in Dashboard
        </a>
      </div>
      <p>Thank you,<br>Office Management Team</p>
    </div>
  `;
}