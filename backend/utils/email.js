// ============================================
// File: backend/utils/email.js
// Email Utility — Sends invite & welcome emails via SMTP
// ============================================

import nodemailer from 'nodemailer';

const BRAND_NAME = 'Campus Flow';
const EMAIL_FROM_NAME = 'Campus Flow';
const EMAIL_SUBTITLE = 'Smart Campus Management System';

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Mask email for safe logging (e.g. h***@gmail.com)
const maskEmail = (email) => {
    if (!email || !email.includes('@')) return '***';
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
};

/**
 * Send an invite email to a newly created user with a one-time password setup link.
 * @param {Object} userData - The user's details
 * @param {string} userData.fullName - The user's full name
 * @param {string} userData.email - The user's email address
 * @param {string} userData.role - The user's role (deptadmin or faculty)
 * @param {string} userData.inviteToken - The raw invite token for the password-set URL
 */
export const sendInviteEmail = async ({ fullName, email, role, inviteToken }) => {
    // Skip if email credentials are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email credentials not configured. Skipping invite email for:', maskEmail(email));
        return { success: false, reason: 'Email credentials not configured' };
    }

    const roleName = role === 'deptadmin' ? 'Department Admin' : 'Faculty';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const setPasswordUrl = `${frontendUrl}/set-password?token=${inviteToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Campus Flow</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Inter, 'Segoe UI', Arial, sans-serif; background-color: #eff8ff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff8ff; padding: 36px 14px;">
            <tr>
                <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cfeeff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 70px rgba(5, 98, 159, 0.16);">
            <!-- Header -->
            <tr>
                <td style="background: linear-gradient(135deg, #eff8ff 0%, #e0f2fe 58%, #ffffff 100%); padding: 34px 30px 30px; text-align: center; border-bottom: 1px solid #d8efff;">
                    <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 20px; background: #ffffff; border: 1px solid #bfe8ff; box-shadow: 0 14px 34px rgba(7, 152, 231, 0.18); color: #0078c5; font-size: 34px; font-weight: 800; margin-bottom: 14px;">⌂</div>
                    <h1 style="color: #05629f; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px;">${BRAND_NAME}</h1>
                    <p style="color: #5b7188; margin: 8px 0 0; font-size: 14px; font-weight: 600;">${EMAIL_SUBTITLE}</p>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #0f172a; margin: 0 0 10px; font-size: 24px; font-weight: 800;">Welcome, ${fullName}!</h2>
                    <p style="color: #526579; font-size: 15px; line-height: 1.65; margin: 0 0 25px;">
                        Your <strong>${roleName}</strong> account has been created by the administrator.
                        To get started, please set up your password by clicking the button below.
                    </p>

                    <!-- Account Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff8ff; border: 1px solid #cfeeff; border-radius: 16px; margin-bottom: 25px;">
                        <tr>
                            <td style="padding: 20px 24px;">
                                <p style="color: #05629f; font-size: 12px; text-transform: uppercase; letter-spacing: 1.4px; margin: 0 0 15px; font-weight: 800;">Your Account Details</p>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Email:</td>
                                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Role:</td>
                                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${roleName}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- Set Password Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="text-align: center; padding: 10px 0 25px;">
                                <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #0798e7 0%, #0078c5 100%); color: #ffffff; text-decoration: none; padding: 15px 42px; border-radius: 14px; font-size: 15px; font-weight: 800; letter-spacing: 0.2px; box-shadow: 0 14px 26px rgba(0, 120, 197, 0.25);">
                                    Set Your Password →
                                </a>
                            </td>
                        </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e6; border: 1px solid #fde68a; border-radius: 16px;">
                        <tr>
                            <td style="padding: 16px 20px;">
                                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                    ⚠️ <strong>Important:</strong> This link will expire in <strong>24 hours</strong>.
                                    If it expires, please contact your administrator to resend the invite.
                                </p>
                            </td>
                        </tr>
                    </table>

                    <!-- Fallback URL -->
                    <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${setPasswordUrl}" style="color: #0078c5; word-break: break-all; font-weight: 700;">${setPasswordUrl}</a>
                    </p>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background-color: #f8fcff; padding: 20px 30px; text-align: center; border-top: 1px solid #d8efff;">
                    <p style="color: #6b7f94; font-size: 12px; margin: 0;">
                        This is an automated email from ${BRAND_NAME}. Please do not reply to this email.
                    </p>
                    <p style="color: #9db2c7; font-size: 11px; margin: 8px 0 0;">
                        © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                    </p>
                </td>
            </tr>
        </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `You're Invited to ${BRAND_NAME} — Set Your Password`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Invite email sent to ${maskEmail(email)} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send invite email to ${maskEmail(email)}:`, error.message);
        return { success: false, reason: error.message };
    }
};

/**
 * Send a password reset email with a one-time reset link.
 * @param {Object} userData
 * @param {string} userData.fullName - The user's full name
 * @param {string} userData.email - The user's email address
 * @param {string} userData.resetToken - The raw reset token for the URL
 */
export const sendPasswordResetEmail = async ({ fullName, email, resetToken }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email credentials not configured. Skipping reset email for:', maskEmail(email));
        return { success: false, reason: 'Email credentials not configured' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Inter, 'Segoe UI', Arial, sans-serif; background-color: #eff8ff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff8ff; padding: 36px 14px;">
            <tr>
                <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cfeeff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 70px rgba(5, 98, 159, 0.16);">
            <!-- Header -->
            <tr>
                <td style="background: linear-gradient(135deg, #eff8ff 0%, #e0f2fe 58%, #ffffff 100%); padding: 34px 30px 30px; text-align: center; border-bottom: 1px solid #d8efff;">
                    <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 20px; background: #ffffff; border: 1px solid #bfe8ff; box-shadow: 0 14px 34px rgba(7, 152, 231, 0.18); color: #0078c5; font-size: 34px; font-weight: 800; margin-bottom: 14px;">⌂</div>
                    <h1 style="color: #05629f; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px;">${BRAND_NAME}</h1>
                    <p style="color: #5b7188; margin: 8px 0 0; font-size: 14px; font-weight: 600;">${EMAIL_SUBTITLE}</p>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #0f172a; margin: 0 0 10px; font-size: 24px; font-weight: 800;">Password Reset Request</h2>
                    <p style="color: #526579; font-size: 15px; line-height: 1.65; margin: 0 0 25px;">
                        Hi <strong>${fullName}</strong>, we received a request to reset your password.
                        Click the button below to create a new password.
                    </p>

                    <!-- Reset Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="text-align: center; padding: 10px 0 25px;">
                                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0798e7 0%, #0078c5 100%); color: #ffffff; text-decoration: none; padding: 15px 42px; border-radius: 14px; font-size: 15px; font-weight: 800; letter-spacing: 0.2px; box-shadow: 0 14px 26px rgba(0, 120, 197, 0.25);">
                                    Reset Password →
                                </a>
                            </td>
                        </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e6; border: 1px solid #fde68a; border-radius: 16px; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 16px 20px;">
                                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                    ⚠️ This link will expire in <strong>1 hour</strong>.
                                    If you didn't request this, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>

                    <!-- Fallback URL -->
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #0078c5; word-break: break-all; font-weight: 700;">${resetUrl}</a>
                    </p>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background-color: #f8fcff; padding: 20px 30px; text-align: center; border-top: 1px solid #d8efff;">
                    <p style="color: #6b7f94; font-size: 12px; margin: 0;">
                        This is an automated email from ${BRAND_NAME}. Please do not reply.
                    </p>
                    <p style="color: #9db2c7; font-size: 11px; margin: 8px 0 0;">
                        © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                    </p>
                </td>
            </tr>
        </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `${BRAND_NAME} — Reset Your Password`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${maskEmail(email)} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send reset email to ${maskEmail(email)}:`, error.message);
        return { success: false, reason: error.message };
    }
};
