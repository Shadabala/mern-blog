import Contact from '../models/Contact.js';
import sendEmail from '../utils/sendEmail.js';

export const createPublicContact = async (req, res) => {
    try {
        const { name, email, phone, company, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and message.' });
        }

        const contact = new Contact({
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : '',
            company: company ? company.trim() : '',
            subject: subject ? subject.trim() : 'General Inquiry',
            message: message.trim(),
            status: 'pending'
        });

        await contact.save();
        res.status(201).json({
            success: true,
            message: 'Thank you! Your message has been sent successfully.',
            contact
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send inquiry', error: error.message });
    }
};

export const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching contact inquiries', error: error.message });
    }
};

export const replyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const contact = await Contact.findById(id);
        if (!contact) return res.status(404).json({ success: false, message: 'Inquiry not found' });

        contact.reply = reply;
        contact.status = 'replied';
        await contact.save();

        // Optional email send to inquiry email
        try {
            await sendEmail({
                to: contact.email,
                subject: `Re: ${contact.subject || 'Support Inquiry'}`,
                text: reply
            });
        } catch (emailErr) {
            console.error("Contact email reply failed:", emailErr.message);
        }

        res.status(200).json({ success: true, message: 'Reply submitted successfully', contact });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error replying to inquiry', error: error.message });
    }
};

export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await Contact.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting inquiry', error: error.message });
    }
};

export const bulkDeleteContacts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty IDs list' });
        }
        await Contact.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} inquiries` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error bulk deleting inquiries', error: error.message });
    }
};
