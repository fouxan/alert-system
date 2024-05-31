const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async ({ email, subject, text }) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

module.exports = { sendEmail };
