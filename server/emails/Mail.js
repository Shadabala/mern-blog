import sendEmail from '../utils/sendEmail.js';
import { resetPasswordTemplate } from './templates/resetPasswordTemplate.js';
import { welcomeTemplate } from './templates/welcomeTemplate.js';

/**
 * Mail Service wrapper (mirrors Laravel Mail::to syntax)
 */
export class Mail {
    constructor(recipientEmail) {
        this.toEmail = recipientEmail;
    }

    /**
     * Mail.to(email) helper
     */
    static to(recipientEmail) {
        return new Mail(recipientEmail);
    }

    /**
     * Send email using a template handler
     * @param {Object} mailable - Template object with { subject, html, text }
     */
    async send(mailable) {
        return await sendEmail({
            to: this.toEmail,
            subject: mailable.subject,
            html: mailable.html,
            text: mailable.text,
        });
    }
}

// Named Mailable Helpers
export const ResetPasswordMail = (data) => resetPasswordTemplate(data);
export const WelcomeMail = (data) => welcomeTemplate(data);

export default Mail;
