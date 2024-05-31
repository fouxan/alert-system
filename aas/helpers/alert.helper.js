const Alert = require("../models/alert.model");
const { getNextCheckTime } = require("./time.helper");
const {convertToTimestamp} = require("./time.helper");

function isMaintenanceWindow(nextCheckTime, action) {
    const endTime = convertToTimestamp(action.timeConstraints.end);
    const startTime = convertToTimestamp(action.timeConstraints.start);
    return { isMaintenanceWindow: nextCheckTime >= startTime && nextCheckTime <= endTime, end: endTime };
}

function isThrottled(nextCheckTime, triggerOptions) {
    if (!triggerOptions.throttle) return false;
    const throttleEndTime =
        new Date().getTime() + triggerOptions.triggerSuppressTime; // assuming triggerSuppressTime is in milliseconds
    return {isThrottled: nextCheckTime < throttleEndTime, end: throttleEndTime};
}



const isActionNeeded = async ({ alertId, result }) => {
    const alert = await Alert.findById(alertId).lean();
    const conditions = alert.conditions;
    let actionNeeded = false;
    let triggerCount = 0;
    if (conditions.trigger == "num_results") {
        if (result.length >= conditions.triggerThreshold) {
            actionNeeded = true;
        }
        if (conditions.triggerSchedule == "every_result") {
            triggerCount = result.length;
        } else {
            triggerCount = 1;
        }
    }
    const type = alert.action.actionType;
    return { actionNeeded, triggerCount, type };
};

const updateNextCheckTime = async ({ alertId }) => {
    try {
        const nextCheckTime = await getNextCheckTime({ alertId });
        const alert = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            { $set: { "alerts.$.nextCheckTime": nextCheckTime } },
            { new: true }
        );

        if (!alert) {
            throw new Error("Alert not found or update failed.");
        }
    } catch (error) {
        console.error("Error updating next check time:", error);
    }
};

const updateQueryExecStatus = async (alertId, status) => {
    try {
        const alert = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            { $set: { "alerts.$.queryExecStatus": status } },
            { new: true }
        );

        if (!alert) {
            throw new Error("Alert not found or update failed.");
        }
    } catch (error) {
        console.error("Error updating query execution status:", error);
    }
};

const getActionDetails = async (alertId) => {
    const alert = await Alert.findById(alertId).lean();
    if (!alert) {
        throw new Error("Alert not found");
    }
    return alert.action;
};

const alertExecutionPaused = async (alertId) => {
    const alert = await Alert.findById(alertId).lean();
    if (!alert) {
        throw new Error("Alert not found");
    }
    return alert.queryExecStatus === "paused";
};

const getAlertName = async (alertId) => {
    const alert = await Alert.findById(alertId).lean();
    if (!alert) {
        throw new Error("Alert not found");
    }
    return alert.name;
};

module.exports = {
    getAlertName,
    alertExecutionPaused,
    updateNextCheckTime,
    updateQueryExecStatus,
    isActionNeeded,
    getActionDetails,
    isMaintenanceWindow,
    isThrottled
};
