import nodemailer from 'nodemailer';
import { 
  getPasswordSetupTemplate, 
  getPasswordResetTemplate, 
  getTaskAssignmentTemplate,
  getTaskReassignedTemplate
} from '../../emails/templates';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'sahilvishwa2108@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'zjfx obfh thac dabr', // App password, not regular password
  },
  tls: {
    rejectUnauthorized: false // Helps with self-signed certificates
  }
});

// Verify connection configuration (optional but recommended)
transporter.verify((error: Error | null) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || 'noreply@officemanagement.com'
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    // Ensure environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Missing email credentials in .env file');
      return { success: false, error: 'Email configuration missing' };
    }

    const mailOptions = { from, to, subject, html };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordSetupEmail(
  email: string,
  name: string,
  token: string,
  userId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const setupUrl = `${baseUrl}/set-password?token=${token}&id=${userId}`;
  
  const html = getPasswordSetupTemplate(name, setupUrl);

  return sendEmail({
    to: email,
    subject: 'Set Up Your Password - Office Management System',
    html
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
  userId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/set-password?token=${token}&id=${userId}`;
  
  const html = getPasswordResetTemplate(name, resetUrl);

  return sendEmail({
    to: email,
    subject: 'Password Reset - Office Management System',
    html
  });
}

export async function sendActivityNotificationEmail(
  email: string,
  name: string,
  activityTitle: string,
  activityDetails: string
) {
  const html = `
    <div>
      <h1>${activityTitle}</h1>
      <p>Hi ${name},</p>
      <p>${activityDetails}</p>
      <p>Thank you,<br>Office Management Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: activityTitle,
    html,
  });
}

export async function sendTaskAssignmentEmail(
  taskId: string,
  email: string,
  name: string,
  taskTitle: string,
  assignerName: string,
  note?: string,
  dueDate?: Date
) {
  console.log(`Sending task assignment email to ${email} for task: ${taskTitle}`);
  
  const html = getTaskAssignmentTemplate(
    taskTitle,
    assignerName,
    note,
    dueDate
  );

  return sendEmail({
    to: email,
    subject: `Task Assigned: ${taskTitle} - Office Management System`,
    html
  });
}

export async function sendTaskReassignedEmail(
  email: string,
  name: string,
  taskTitle: string,
  newAssigneeName: string
) {
  console.log(`Sending task reassignment email to ${email} for task: ${taskTitle}`);
  
  const html = getTaskReassignedTemplate(
    taskTitle,
    newAssigneeName
  );

  return sendEmail({
    to: email,
    subject: `Task Reassigned: ${taskTitle} - Office Management System`,
    html
  });
}