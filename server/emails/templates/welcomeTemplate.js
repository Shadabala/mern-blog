import { baseLayout } from './baseLayout.js';

/**
 * Welcome Email Template
 * @param {Object} data
 * @param {string} data.name - Recipient name
 */
export const welcomeTemplate = ({ name }) => {
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 15px 0;">Welcome to MERN Blog! 🎉</h2>
    <p style="font-size: 16px; line-height: 24px; color: #374151; margin: 0 0 15px 0;">
      Hi <strong>${name}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #4b5563; margin: 0 0 25px 0;">
      Thank you for joining our community! We are excited to have you on board. Start exploring articles or create your very first blog post today.
    </p>
    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 25px 0;">
      <tr>
        <td align="center" style="border-radius: 6px;" bgcolor="#4F46E5">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" target="_blank" style="font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 12px 28px; display: inline-block; background-color: #4F46E5;">
            Explore MERN Blog
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: 'Welcome to MERN Blog!',
    html: baseLayout({ title: 'Welcome to MERN Blog', content }),
    text: `Hi ${name},\n\nWelcome to MERN Blog! Thank you for joining our community.`,
  };
};

export default welcomeTemplate;
