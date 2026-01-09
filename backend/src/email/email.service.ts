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
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
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
}
