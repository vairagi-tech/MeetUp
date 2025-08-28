import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Student Scheduler'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your Student Scheduler account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #3B82F6; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to Student Scheduler!</h1>
            </div>
            
            <div style="padding: 40px;">
              <h2 style="color: #1F2937; margin-top: 0;">Hi ${firstName},</h2>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Thank you for registering with Student Scheduler! We're excited to help you connect with your classmates and find the perfect time to meet.
              </p>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                To complete your registration and start using all our features, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background-color: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${verificationUrl}" style="color: #3B82F6; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
                This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
              </p>
            </div>
            
            <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                The Student Scheduler Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${firstName},
        
        Thank you for registering with Student Scheduler!
        
        To complete your registration, please verify your email address by visiting:
        ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
        
        Best regards,
        The Student Scheduler Team
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Student Scheduler'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your Student Scheduler password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #EF4444; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            
            <div style="padding: 40px;">
              <h2 style="color: #1F2937; margin-top: 0;">Hi ${firstName},</h2>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your Student Scheduler account.
              </p>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                If you made this request, click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background-color: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${resetUrl}" style="color: #EF4444; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <div style="background-color: #FEF2F2; border-left: 4px solid #F87171; padding: 15px; margin: 20px 0;">
                <p style="color: #991B1B; font-size: 14px; margin: 0; font-weight: bold;">
                  Security Notice:
                </p>
                <p style="color: #7F1D1D; font-size: 14px; margin: 5px 0 0 0;">
                  This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
            </div>
            
            <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                The Student Scheduler Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${firstName},
        
        We received a request to reset the password for your Student Scheduler account.
        
        If you made this request, visit this link to reset your password:
        ${resetUrl}
        
        This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        
        Best regards,
        The Student Scheduler Team
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Student Scheduler'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Student Scheduler - Get Started!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Student Scheduler</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #10B981; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Welcome aboard, ${firstName}!</h1>
            </div>
            
            <div style="padding: 40px;">
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Your email has been verified and your Student Scheduler account is now active! 🎉
              </p>
              
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Here's what you can do next:
              </p>
              
              <ul style="color: #4B5563; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                <li>📅 Import your class timetable</li>
                <li>👥 Find and connect with classmates</li>
                <li>⏰ Discover common free time slots</li>
                <li>📍 Share your location with friends (optional)</li>
                <li>🎉 Join university events and activities</li>
              </ul>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${frontendUrl}/app/dashboard" 
                   style="display: inline-block; background-color: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Start Using Student Scheduler
                </a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
                Need help getting started? Check out our <a href="${frontendUrl}/help" style="color: #10B981;">help center</a> or reply to this email with any questions.
              </p>
            </div>
            
            <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px; margin: 0;">
                Happy scheduling!<br>
                The Student Scheduler Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}
