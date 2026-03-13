const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;
    
    // Nếu có SMTP thật từ biến môi trường
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Dùng Ethereal Email giả lập cho môi trường Test/Dev
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true cho cổng 465, false cho cổng khác
            auth: {
                user: testAccount.user, // user Ethereal tự generate
                pass: testAccount.pass, // pass tự generate
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
