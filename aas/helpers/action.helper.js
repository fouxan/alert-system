const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const axios = require("axios");
const { WebClient } = require("@slack/web-api");

const { getAlertName } = require("./alert.helper");

// const { linkToAlert, linkToResult, attachCSV, attachPDF } = options;
//
// if (attachCSV) {
//     const csvLink = generateCSVLink(); // Implement this function
//     mailOptions.html += `<a href="${csvLink}">View CSV</a>`;
// }
// if (attachPDF) {
//     const pdfLink = generatePDFLink(); // Implement this function
//     mailOptions.html += `<a href="${pdfLink}">View PDF</a>`;
// }
// if (linkToAlert) {
//     const alertLink = getAlertLink(); // Implement this function
//     mailOptions.html += `<a href="${alertLink}">View Alert</a>`;
// }
// if (linkToResult) {
//     const resultLink = getResultLink(); // Implement this function
//     mailOptions.html += `<a href="${resultLink}">View Result</a>`;
// }

async function getTemplate(templateName) {
    const filePath = path.join(
        __dirname,
        "..",
        "public",
        templateName,
        `index.html`
    );
    const templateSource = await fs.promises.readFile(filePath, "utf8");
    return Handlebars.compile(templateSource);
}

async function notifyUsers({ userList, alertId, type, result }) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASS,
        },
    });

    const alertName = await getAlertName(alertId);

    const templateName = type === "error" ? "error-alert" : "trigger-alert";
    const template = await getTemplate(templateName);

    const htmlContent = template({
        alertId,
        alertName,
        results: JSON.stringify(result, null, 2),
    });

    const emails = userList.map((user) => user.email).join(", ");

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: emails,
        subject: `${
            type === "error" ? "Error" : "Trigger"
        } Alert: ${alertId} - ${alertName}`,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", emails);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

async function sendSlackMessage({ channel, message }) {
    const slackClient = new WebClient(actionSettings.slack.token);
    try {
        await slackClient.chat.postMessage({
            channel: channel,
            text: message,
        });
        console.log("Slack message sent successfully");
    } catch (error) {
        console.error("Failed to send Slack message:", error);
    }
}

async function sendWebexMessage({ roomId, message, apiKey }) {
    try {
        await axios.post(
            "https://webexapis.com/v1/messages",
            {
                roomId: roomId,
                text: message,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("Webex message sent successfully");
    } catch (error) {
        console.error("Failed to send Webex message:", error);
    }
}

async function sendWebhookNotification({ url, message }) {
    try {
        await axios.post(url, {
            message: message,
        });
        console.log("Webhook notification sent successfully");
    } catch (error) {
        console.error("Failed to send webhook notification:", error);
    }
}

async function sendMail({ email, subject, text, bodyType, options }) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
    };

    if (bodyType === "html") {
        mailOptions.html = text;
    }else{
        mailOptions.text = text;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", emails);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

async function sendAction({ actionDetails }) {
    const { actionType, actionSettings } = actionDetails;
    const subject =
        actionType === "email"
            ? actionSettings.email.subject +
              ` | ${actionSettings.email.priority.toUpperCase()} Priority`
            : null;

    switch (actionType) {
        case "email":
            message = actionSettings.email.body;
            await sendMail({
                email: actionSettings.email.to,
                subject,
                bodyType: actionSettings.email.bodyType,
                text: actionSettings.email.body,
                options: actionSettings.email.options,
            });
            break;
        case "slack":
            await sendSlackMessage({
                channel: actionSettings.slack.channel,
                message: actionSettings.slack.message,
            });
            break;
        case "webex":
            await sendWebexMessage({
                roomId: actionSettings.webex.room,
                message: actionSettings.webex.message,
                apiKey: actionSettings.webex.apiKey,
            });
            break;
        case "webhook":
            await sendWebhookNotification({
                url: actionSettings.webhook.url,
                message: actionSettings.webhook.message,
            });
            break;
        default:
            console.error("Unsupported action type:", actionType);
    }
}

module.exports = { sendAction, notifyUsers };
