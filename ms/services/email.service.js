const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const subjects = {
    "user-registered": "Welcome to Nudge",
    "forgot-password": "Password reset request from Nudge",
    "{field}-changed": "Your {field} has been changed",
};

async function sendEmail({ to, subject, templateName, variables }) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "email",
        `${templateName}`,
        `index.html`
    );
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    Object.keys(variables).forEach((key) => {
        htmlContent = htmlContent.replace(
            new RegExp(`{{${key}}}`, "g"),
            variables[key]
        );
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject ? subject : subjects[templateName],
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

module.exports = { sendEmail };
