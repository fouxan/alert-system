const axios = require('axios');

async function sendWebhookNotification(alertDetails, actionDetails) {
    try {
        await axios.post(actionDetails.webhookUrl, {
            alertName: alertDetails.alertName,
            message: actionDetails.message,
            additionalData: actionDetails.additionalData,
        });
        console.log('Webhook notification sent successfully');
    } catch (error) {
        console.error('Failed to send webhook notification:', error);
    }
}

module.exports = { sendWebhookNotification };
