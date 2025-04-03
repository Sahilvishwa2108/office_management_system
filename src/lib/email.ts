import nodemailer from 'nodemailer';

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

export async function sendPasswordSetupEmail(
  email: string,
  name: string,
  token: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const setupUrl = `${baseUrl}/set-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Set Up Your Password - Office Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to the Office Management System, ${name}!</h2>
        <p>An account has been created for you. Please set up your password by clicking the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${setupUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Set Up Your Password
          </a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this account, please ignore this email.</p>
        <p>Thank you,<br>Office Management Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password setup email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/set-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset - Office Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for the Office Management System. Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Your Password
          </a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Thank you,<br>Office Management Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

export async function sendActivityNotificationEmail(
  email: string,
  name: string,
  activityTitle: string,
  activityDetails: string,
  activityType: string
) {
  // Add console log for debugging
  console.log(`Sending email to ${email} for activity: ${activityTitle}`);
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const dashboardUrl = `${baseUrl}/dashboard`;

  // Icon based on activity type
  let activityIcon = "📝";
  switch(activityType) {
    case 'user': activityIcon = "👤"; break;
    case 'task': activityIcon = "✅"; break;
    case 'client': activityIcon = "🏢"; break;
    case 'document': activityIcon = "📄"; break;
    case 'message': activityIcon = "💬"; break;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@officemanagement.com',
    to: email,
    subject: `New Activity: ${activityTitle} - Office Management System`,
    html: `
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
    `
  };

  try {
    // Ensure environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Missing email credentials in .env file');
      return { success: false, error: 'Email configuration missing' };
    }

    await transporter.sendMail(mailOptions);
    console.log(`Activity notification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending activity notification email:', error);
    return { success: false, error };
  }
}