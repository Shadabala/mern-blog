/**
 * Base Email Layout Template
 * Provides common responsive HTML styling, header/logo, container, and footer.
 */
export const baseLayout = ({ title, content, footerText }) => {
  const appName = process.env.SMTP_FROM_NAME || 'MERN Blog';
  
  return `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title || appName}</title>
<style type="text/css">
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  table { border-collapse: collapse !important; }
  body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
</style>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #f4f6f9;" bgcolor="#f4f6f9">
<table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
        <td align="center" style="background-color: #f4f6f9; padding: 20px 0;" bgcolor="#f4f6f9">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <!-- Header -->
                <tr>
                    <td align="center" valign="top" style="padding: 25px 35px; background-color: #4F46E5;" bgcolor="#4F46E5">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${appName}</h1>
                    </td>
                </tr>
                <!-- Body Content -->
                <tr>
                    <td align="left" style="padding: 35px 35px 25px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                        ${content}
                    </td>
                </tr>
                <!-- Footer -->
                <tr>
                    <td align="center" bgcolor="#f9fafb" style="padding: 20px 30px; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0;">${footerText || `© ${new Date().getFullYear()} ${appName}. All rights reserved.`}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>`;
};

export default baseLayout;
