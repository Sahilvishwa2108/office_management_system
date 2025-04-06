export function getPasswordSetupTemplate(name: string, setupUrl: string): string {
  return `
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
  `;
}

export function getPasswordResetTemplate(name: string, resetUrl: string): string {
  return `
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
  `;
}