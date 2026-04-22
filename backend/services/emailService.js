const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const isProd = process.env.NODE_ENV === 'production';
    const hasSmtpEnv = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (isProd && !hasSmtpEnv) {
        throw new Error('EMAIL_SMTP_CONFIG_MISSING');
    }

    let transporter;

    if (hasSmtpEnv) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Dev/Test: fallback Ethereal
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const mailOptions = {
        from: 'Junkio Expense Tracker <noreply@junkio.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    if (!process.env.EMAIL_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
