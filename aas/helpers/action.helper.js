const nodemailer = require("nodemailer");
const axios = require("axios");
const { WebClient } = require("@slack/web-api");

async function sendEmail({ email, subject, text, bodyType, options }) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASS,
        },
    });

    // const { linkToAlert, linkToResult, attachCSV, attachPDF} = options;

    // if(attachCSV){
    //     // Attach CSV file
    //     const link = generateCSVLink();
    //     text = text + `<a href="${link}">View CSV</a>`;
    // }
    // if(attachPDF){
    //     // Attach PDF file
    //     const link = generatePDFLink();
    //     text = text + `<a href="${link}">View PDF</a>`;
    // }
    // if(linkToAlert){
    //     // Link to alert details
    //     const link = getAlertLink();
    //     text = text + `<a href="${link}">View Alert</a>`;
    // }
    // if(linkToResult){
    //     // Link to CSV file
    //     const link = getResultLink();
    //     text = text + `<a href="${link}">View Result</a>`;
    // }

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: subject, // Subject line
        text: text, // plain text body
        html: text, // html body
    };

    if(bodyType === "html") {
        delete mailOptions.text;
    }else{
        delete mailOptions.html;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
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

async function sendAction({ userList, type, actionDetails, result }) {
    // Assuming actionDetails is an object containing action configurations
    const { actionType, actionSettings } = actionDetails;
    const subject = error
        ? "Error Notification"
        : actionType === "email"
        ? actionSettings.email.subject + ` | ${actionSettings.email.priority.toUpperCase()} Priority`
        : null;

    if (type === "error") {
        const message = result;
        userList.forEach((user) => {
            sendEmail({ email: user.email, subject, text: message });
        });
    } else {
        switch (actionType) {
            case "email":
                message = actionSettings.email.body;
                await sendEmail({
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
}

module.exports = { sendAction };
