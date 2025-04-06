export function getTaskAssignmentTemplate(
  taskTitle: string,
  assignerName: string,
  note?: string,
  dueDate?: Date
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>You've been assigned a new task</h2>
      <p><strong>Task:</strong> ${taskTitle}</p>
      <p><strong>Assigned by:</strong> ${assignerName}</p>
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
      <p><strong>Due date:</strong> ${
        dueDate ? new Date(dueDate).toLocaleDateString() : "No due date"
      }</p>
      <p>Log in to the system to view task details.</p>
      <p>Thank you,<br>Office Management Team</p>
    </div>
  `;
}

export function getTaskReassignedTemplate(
  taskTitle: string,
  newAssigneeName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Task Reassigned</h2>
      <p>Your task "${taskTitle}" has been reassigned to ${newAssigneeName}</p>
      <p>Thank you,<br>Office Management Team</p>
    </div>
  `;
}