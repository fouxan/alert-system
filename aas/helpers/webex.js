const axios = require('axios');

async function sendWebexMessage(alertDetails, actionDetails) {
    try {
        await axios.post('https://webexapis.com/v1/messages', {
            roomId: actionDetails.roomId,
            text: `${alertDetails.alertName}: ${actionDetails.message}`,
        }, {
            headers: {
                'Authorization': `Bearer ${actionDetails.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Webex message sent successfully');
    } catch (error) {
        console.error('Failed to send Webex message:', error);
    }
}

module.exports = { sendWebexMessage };
