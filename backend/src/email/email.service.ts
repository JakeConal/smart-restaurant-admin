/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: any;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize Gmail SMTP transporter
   */
  private initializeTransporter(): void {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailAppPassword) {
      console.warn(
        '⚠️  Gmail credentials not configured. Using console fallback for email sending.',
      );
      console.warn(
        'Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables to enable Gmail SMTP.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  /**
   * Send email verification link to customer
   */
  async sendVerificationEmail(
    email: string,
    verificationToken: string,
    customerName: string,
  ): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background-color: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Smart Restaurant!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hi ${customerName},</p>
              <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #0066cc;"><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p style="color: #666; font-size: 14px;">This verification link will expire in 24 hours.</p>
              <p style="color: #999; font-size: 12px;">If you did not sign up for this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Smart Restaurant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.transporter.sendMail({
        from: `Smart Restaurant <${gmailUser}>`,
        to: email,
        subject: 'Verify Your Email - Smart Restaurant',
        html: htmlContent,
        text: `Verify your email: ${verificationUrl}`,
      });

      console.log(`📧 Email sent to ${email}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      // Fallback: log to console for development
      console.log(
        `📧 [FALLBACK] Email Verification Link (${email}):`,
        `${process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`,
      );
      return false;
    }
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(
    email: string,
    customerName: string,
  ): Promise<boolean> {
    try {
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Smart Restaurant! 🎉</h1>
            </div>
            <div class="content">
              <h2>Email Verified Successfully</h2>
              <p>Hi ${customerName},</p>
              <p>Your email has been verified! You can now enjoy all features of Smart Restaurant.</p>
              <a href="${process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000'}/menu" class="button">View Menu</a>
              <h3>What's Next?</h3>
              <ul>
                <li>Browse our delicious menu</li>
                <li>Place your first order</li>
                <li>Track your delivery in real-time</li>
                <li>Save your favorite items</li>
              </ul>
              <p>If you have any questions, feel free to contact us!</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Smart Restaurant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.transporter.sendMail({
        from: `Smart Restaurant <${gmailUser}>`,
        to: email,
        subject: 'Welcome to Smart Restaurant!',
        html: htmlContent,
        text: 'Your email has been verified! Welcome to Smart Restaurant.',
      });

      console.log(
        `🎉 Welcome email sent to ${email}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      console.log(`🎉 [FALLBACK] Welcome email for ${customerName} (${email})`);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    tableToken?: string,
  ): Promise<boolean> {
    try {
      let resetUrl = `${process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      if (tableToken) {
        resetUrl += `&tableToken=${encodeURIComponent(tableToken)}`;
      }
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
            .warning { background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #0066cc;"><a href="${resetUrl}">${resetUrl}</a></p>
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2026 Smart Restaurant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.transporter.sendMail({
        from: `Smart Restaurant <${gmailUser}>`,
        to: email,
        subject: 'Reset Your Password - Smart Restaurant',
        html: htmlContent,
        text: `Reset your password: ${resetUrl}`,
      });

      console.log(
        `🔐 Password reset email sent to ${email}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      console.log(
        `🔐 [FALLBACK] Password reset link (${email}):`,
        `${process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
      );
      return false;
    }
  }

  /**
   * Send email verification link to admin
   */
  async sendAdminVerificationEmail(
    email: string,
    fullName: string,
    verificationToken: string,
  ): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${verificationToken}`;
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; color: #1e293b; }
            .content h2 { color: #1e293b; font-size: 20px; margin-bottom: 20px; }
            .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); }
            .button:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
            .info-box { background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { background-color: #f8fafc; color: #64748b; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; }
            .security-notice { color: #64748b; font-size: 13px; margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 6px; border: 1px solid #fbbf24; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Smart Restaurant Admin Portal</h1>
            </div>
            <div class="content">
              <h2>Email Verification Required</h2>
              <p>Hello <strong>${fullName}</strong>,</p>
              <p>Your admin account has been created. To complete the setup and secure your account, please verify your email address by clicking the button below:</p>
              <center>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </center>
              <div class="info-box">
                <p style="margin: 0;"><strong>Alternative:</strong> If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #3b82f6; margin: 10px 0 0 0;"><a href="${verificationUrl}">${verificationUrl}</a></p>
              </div>
              <div class="security-notice">
                <strong>⏱️ Security Notice:</strong> This verification link will expire in <strong>1 hour</strong> for security purposes. If you did not create an admin account, please contact your system administrator immediately.
              </div>
            </div>
            <div class="footer">
              <p><strong>Smart Restaurant Admin Portal</strong></p>
              <p>&copy; 2026 Smart Restaurant. All rights reserved.</p>
              <p style="margin-top: 10px; color: #94a3b8;">This is an automated message from the admin system.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.transporter.sendMail({
        from: `Smart Restaurant Admin <${gmailUser}>`,
        to: email,
        subject: '[Admin] Verify Your Email Address - Smart Restaurant',
        html: htmlContent,
        text: `Verify your admin email: ${verificationUrl}`,
      });

      console.log(`📧 Admin verification email sent to ${email}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending admin verification email:', error);
      console.log(
        `📧 [FALLBACK] Admin Email Verification Link (${email}):`,
        `${process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${verificationToken}`,
      );
      return false;
    }
  }

  /**
   * Send password reset email to admin
   */
  async sendAdminPasswordResetEmail(
    email: string,
    fullName: string,
    resetToken: string,
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; color: #1e293b; }
            .content h2 { color: #1e293b; font-size: 20px; margin-bottom: 20px; }
            .button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); }
            .button:hover { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); }
            .info-box { background-color: #f1f5f9; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { background-color: #f8fafc; color: #64748b; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; }
            .warning { background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 25px 0; }
            .warning-title { color: #dc2626; font-weight: 600; font-size: 16px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Admin Password Reset</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello <strong>${fullName}</strong>,</p>
              <p>We received a request to reset your admin account password. Click the button below to create a new password:</p>
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              <div class="info-box">
                <p style="margin: 0;"><strong>Alternative:</strong> If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #dc2626; margin: 10px 0 0 0;"><a href="${resetUrl}">${resetUrl}</a></p>
              </div>
              <div class="warning">
                <div class="warning-title">⚠️ Important Security Information</div>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This password reset link will expire in <strong>30 minutes</strong></li>
                  <li>All active sessions will be terminated after password reset</li>
                  <li>If you did not request this reset, please contact your system administrator immediately</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This is an automated security message. Your account security is our priority.</p>
            </div>
            <div class="footer">
              <p><strong>Smart Restaurant Admin Portal</strong></p>
              <p>&copy; 2026 Smart Restaurant. All rights reserved.</p>
              <p style="margin-top: 10px; color: #94a3b8;">This is an automated security message from the admin system.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.transporter.sendMail({
        from: `Smart Restaurant Admin <${gmailUser}>`,
        to: email,
        subject: '[Admin] Password Reset Request - Smart Restaurant',
        html: htmlContent,
        text: `Reset your admin password: ${resetUrl}`,
      });

      console.log(
        `🔐 Admin password reset email sent to ${email}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      console.error('❌ Error sending admin password reset email:', error);
      console.log(
        `🔐 [FALLBACK] Admin password reset link (${email}):`,
        `${process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`,
      );
      return false;
    }
  }
}
