const { WebClient } = require('@slack/web-api');

const slackClient = new WebClient('xoxb-your-slack-token');

async function sendSlackMessage(alertDetails, actionDetails) {
    try {
        await slackClient.chat.postMessage({
            channel: actionDetails.channel,
            text: `${alertDetails.alertName}: ${actionDetails.message}`,
        });
        console.log('Slack message sent successfully');
    } catch (error) {
        console.error('Failed to send Slack message:', error);
    }
}

module.exports = { sendSlackMessage };
