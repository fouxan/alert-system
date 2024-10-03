const handlebars = require("handlebars");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { WebClient } = require("@slack/web-api");

// TODO: Finish implementing the notifyUsers, sendSlack and sendWebex functions

async function notifyUsers({ userList, type, variables }) {
    if (userList.length === 0) {
        console.log("Empty user list, no users to notify.");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const templateName = type === "error" ? "error-alert" : "trigger-alert";
    const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "email",
        templateName,
        "index.html"
    );

    let htmlContent;
    try {
        htmlContent = fs.readFileSync(templatePath, "utf8");
    } catch (err) {
        console.error("Failed to read email template:", err);
        return;
    }

    // Replacing variables in the email template
    Object.keys(variables).forEach((key) => {
        htmlContent = htmlContent.replace(
            new RegExp(`{{${key}}}`, "g"),
            variables[key]
        );
    });

    // Notify users by email, Slack, and Webex based on their preferences
    for (const user of userList) {
        const { email, slack, webex } = user;

        // Email notification
        if (email && email.emailId) {
            try {
                await sendMail({
                    email: email.emailId,
                    subject: email?.subject,
                    bodyTemplate: email?.body || htmlContent,
                    bodyType: "html",
                    options: email?.options,
                });
                console.log(`Email sent successfully to: ${email}`);
            } catch (error) {
                console.error(`Failed to send email to ${email}:`, error);
            }
        }

        // Slack notification
        if (slack && slack.token && slack.channel) {
            const slackMessage = slack?.message;
            if (!slackMessage && !slack.blocks && !slack.options) {
                const slackTemplatePath = path.join(
                    __dirname,
                    "..",
                    "templates",
                    "slack",
                    templateName,
                    "index.txt"
                );
                try {
                    slackMessage = fs.readFileSync(slackTemplatePath, "utf8");
                } catch (err) {
                    console.error("Failed to read slack template:", err);
                    return;
                }
                Object.keys(variables).forEach((key) => {
                    slackMessage = slackMessage.replace(
                        new RegExp(`{{${key}}}`, "g"),
                        variables[key]
                    );
                });
            }
            try {
                await sendSlackMessage({
                    token: slack.token,
                    channel: slack.channel,
                    message: slackMessage,
                    blocks: slack?.blocks,
                    options: slack?.options,
                });
                console.log(
                    `Slack message sent successfully to channel: ${slack.channel}`
                );
            } catch (error) {
                console.error(
                    `Failed to send Slack message to channel ${slack.channel}:`,
                    error
                );
            }
        }

        // Webex notification
        if (webex && webex.room && webex.apiKey) {
            try {
                await sendWebexMessage({
                    roomId: webex.room,
                    message: webex?.message,
                    apiKey: webex.apiKey,
                });
                console.log(
                    `Webex message sent successfully to room: ${webex.room}`
                );
            } catch (error) {
                console.error(
                    `Failed to send Webex message to room ${webex.room}:`,
                    error
                );
            }
        }
    }
}

async function sendSlackMessage({ token, channel, message, blocks, options }) {
    const slackClient = new WebClient(token);
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

async function sendMail({ email, subject, bodyTemplate, bodyType, options }) {
    console.log("Email:", email);
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
    };

    console.log("Body template:", bodyTemplate);

    const context = {
        currentTime: options?.currentTime || new Date().toLocaleString(),
        queryResults: options?.queryResults || "",
        queryStatus: options?.queryStatus || "",
        resultCount: options?.resultCount || 0,
        alertName: options?.alertName || "",
        linkToResults: options?.linkToResults || "",
        linkToAlert: options?.linkToAlert || "",
    };

    const template = handlebars.compile(bodyTemplate);
    const body = template(context);

    if (bodyType === "html") {
        mailOptions.html = body;
    } else {
        mailOptions.text = body;
    }

    if (options.csv) {
        mailOptions.attachments = [
            {
                filename: "results.csv",
                path: options.csv,
            },
        ];
    }

    try {
        await transporter.sendMail(mailOptions);
        if (options.csv) {
            fs.unlinkSync(options.csv);
        }
        console.log("Email sent successfully to:", email);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

async function sendAction(actionDetails) {
    if (!["email", "slack", "webex", "webhook"].includes(actionDetails.type)) {
        console.error("Unsupported action type:", actionDetails.type);
        return;
    }
    if (actionDetails.type === "email") {
        await sendMail(actionDetails);
    }
    if (actionDetails.type === "slack") {
        await sendSlackMessage(actionDetails);
    }
    if (actionDetails.type === "webex") {
        await sendWebexMessage(actionDetails);
    }
    if (actionDetails.type === "webhook") {
        await sendWebhookNotification(actionDetails);
    }
    // switch (actionDetails.type) {
    //     case "email":
    //         await sendMail(actionDetails);
    //         break;
    //     case "slack":
    //         await sendSlackMessage(actionDetails);
    //         break;
    //     case "webex":
    //         await sendWebexMessage(actionDetails);
    //         break;
    //     case "webhook":
    //         await sendWebhookNotification(actionDetails);
    //         break;
    //     default:
    //         console.error("Unsupported action type:", actionType);
    // }
}

module.exports = { sendAction, notifyUsers };
