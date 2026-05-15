// ============================================
// File: backend/utils/email.js
// Email Utility — Sends invite & welcome emails via SMTP
// ============================================

import nodemailer from 'nodemailer';

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
        <title>You're Invited to University LMS</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
                <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎓 University LMS</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Learning Management System</p>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 22px;">Welcome, ${fullName}!</h2>
                    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                        Your <strong>${roleName}</strong> account has been created by the administrator.
                        To get started, please set up your password by clicking the button below.
                    </p>

                    <!-- Account Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px;">
                        <tr>
                            <td style="padding: 20px 24px;">
                                <p style="color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px; font-weight: 600;">Your Account Details</p>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Email:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Role:</td>
                                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${roleName}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- Set Password Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="text-align: center; padding: 10px 0 25px;">
                                <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                                    Set Your Password →
                                </a>
                            </td>
                        </tr>
                    </table>

                    <!-- Expiry Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;">
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
                        <a href="${setPasswordUrl}" style="color: #3b82f6; word-break: break-all;">${setPasswordUrl}</a>
                    </p>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        This is an automated email from University LMS. Please do not reply to this email.
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0;">
                        © ${new Date().getFullYear()} University LMS. All rights reserved.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"University LMS" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `You're Invited to University LMS — Set Your Password`,
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
