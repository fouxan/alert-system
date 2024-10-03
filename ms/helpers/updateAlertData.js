const Alert = require("../models/alert.model");

const updateAlertData = async (alertId, newData) => {
    try {
        let updateOperation = {};
        Object.keys(newData).forEach((key) => {
            updateOperation[`alerts.$.${key}`] = newData[key];
        });

        const result = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            { $set: updateOperation },
            { new: true }
        );

        if (!result) {
            throw new Error("Alert not found or update failed.");
        }

        const updatedAlert = result.alerts.find(
            (alert) => alert._id.toString() === alertId
        );
        return updatedAlert;
    } catch (error) {
        console.error("Error updating alert data: ", error);
        throw error;
    }
};

module.exports = updateAlertData;
