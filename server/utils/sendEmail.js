import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer transporter based on process.env.MAIL_MAILER setting
 * @returns {import('nodemailer').Transporter}
 */
const createTransporter = () => {
    const mailer = (process.env.MAIL_MAILER || 'smtp').toLowerCase();

    // 1. Sendmail mailer driver
    if (mailer === 'sendmail') {
        return nodemailer.createTransport({
            sendmail: true,
            path: process.env.MAIL_SENDMAIL_PATH || '/usr/sbin/sendmail',
            newline: 'unix',
        });
    }

    // 2. Log / Console mailer driver (for development & testing)
    if (mailer === 'log') {
        return nodemailer.createTransport({
            jsonTransport: true,
        });
    }

    // 3. SMTP mailer driver (default)
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10);
    const encryption = (process.env.MAIL_ENCRYPTION || '').toLowerCase();
    const isSecure = encryption === 'ssl' || port === 465 || process.env.SMTP_SECURE === 'true';

    const username = process.env.MAIL_USERNAME || process.env.SMTP_USER;
    const password = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;

    const transportOptions = {
        host,
        port,
        secure: isSecure,
        auth: (username && password) ? {
            user: username,
            pass: password,
        } : undefined,
        tls: {
            rejectUnauthorized: false
        }
    };

    if (process.env.MAIL_SERVICE) {
        transportOptions.service = process.env.MAIL_SERVICE;
    }

    return nodemailer.createTransport(transportOptions);
};

/**
 * Helper to interpolate ${ENV_VAR} syntax in configuration strings
 * @param {string} val 
 * @returns {string}
 */
const resolveEnvVar = (val) => {
    if (!val) return '';
    return val.replace(/\${(\w+)}/g, (_, key) => process.env[key] || '');
};

/**
 * Send an email using credentials configured in .env (MAIL_MAILER, MAIL_HOST, etc.)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 */
export const sendEmail = async ({ to, subject, text, html }) => {
    const mailer = (process.env.MAIL_MAILER || 'smtp').toLowerCase();
    const username = process.env.MAIL_USERNAME || process.env.SMTP_USER;

    const rawFromName = process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || process.env.APP_NAME || 'My Application';
    const fromName = resolveEnvVar(rawFromName);
    const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM_EMAIL || username || 'noreply@example.com';


    const transporter = createTransporter();

    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        text,
        html,
    };

    const info = await transporter.sendMail(mailOptions);

    if (mailer === 'log') {
        console.log('--- [MAIL LOG] Email captured (MAIL_MAILER=log) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body (Text): ${text || '(HTML output)'}`);
        console.log('----------------------------------------------------');
    } else {
        console.log('Email sent successfully via %s mailer: %s', mailer, info.messageId);
    }

    return info;
};

export default sendEmail;

