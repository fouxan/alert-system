const Alert = require('../models/alert.model');

const updateExpiredAlerts = async () => {
    try {
        const currentTime = new Date();
        const result = await Alert.updateMany(
            {
                'alerts.schedule.expiry': { $lt: currentTime },
                'alerts.status': { $ne: 'expired' }
            },
            {
                $set: { 'alerts.$.status': 'expired' }
            }
        );
        console.log(`${result.modifiedCount} alerts were updated to expired.`);
    } catch (error) {
        console.error("Error updating expired alerts:", error);
    }
};

module.exports = { updateExpiredAlerts };
