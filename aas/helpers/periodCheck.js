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

module.exports = {isMaintenanceWindow, isThrottled};
