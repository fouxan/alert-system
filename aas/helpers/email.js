const nodemailer = require('nodemailer');

async function sendEmail(alertDetails, actionDetails) {
    const transporter = nodemailer.createTransport({
        host: "smtp.example.com", // SMTP server host
        port: 587, // SMTP server port
        secure: false, // true for 465, false for other ports
        auth: {
            user: "email@example.com", // your SMTP username
            pass: "password", // your SMTP password
        },
    });

    const mailOptions = {
        from: '"Alert System" <alerts@example.com>', // sender address
        to: actionDetails.to, // list of receivers
        subject: actionDetails.emailSubject, // Subject line
        text: actionDetails.emailBody, // plain text body
        html: `<b>${actionDetails.emailBody}</b>`, // html body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

module.exports = { sendEmail };
