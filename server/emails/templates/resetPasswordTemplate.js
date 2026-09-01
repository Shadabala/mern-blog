import { baseLayout } from './baseLayout.js';

/**
 * Reset Password Email Template
 * @param {Object} data
 * @param {string} data.name - Recipient name
 * @param {string} [data.otp] - OTP Code
 * @param {string} [data.resetUrl] - Reset password link URL
 */
export const resetPasswordTemplate = ({ name, otp, resetUrl }) => {
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 15px 0;">Password Reset Request</h2>
    <p style="font-size: 16px; line-height: 24px; color: #374151; margin: 0 0 15px 0;">
      Hi <strong>${name}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #4b5563; margin: 0 0 20px 0;">
      We received a request to reset your password. Use the OTP verification code below to complete your password reset. This code is valid for <strong>10 minutes</strong>.
    </p>

    ${otp ? `
    <div style="background-color: #f3f4f6; border: 1px dashed #4F46E5; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 25px 0;">
      <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your OTP Code</span>
      <span style="font-size: 32px; font-weight: 800; color: #4F46E5; letter-spacing: 6px; font-family: monospace;">${otp}</span>
    </div>
    ` : ''}

    ${resetUrl ? `
    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 25px 0;">
      <tr>
        <td align="center" style="border-radius: 6px;" bgcolor="#4F46E5">
          <a href="${resetUrl}" target="_blank" style="font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 12px 28px; display: inline-block; background-color: #4F46E5;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    ` : ''}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">
      If you did not request a password reset, please ignore this email.
    </p>
  `;

  return {
    subject: otp ? `Your OTP Code: ${otp}` : 'Password Reset Request',
    html: baseLayout({ title: 'Reset Password', content }),
    text: `Hi ${name},\n\nYour password reset OTP code is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  };
};

export default resetPasswordTemplate;

