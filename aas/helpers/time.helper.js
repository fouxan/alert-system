const Alert = require("../models/alert.model");
const { isMaintenanceWindow, isThrottled } = require("./periodCheck");

const msSinceMidnight = () => {
    const now = new Date();
    const midnight = new Date(now.setHours(0, 0, 0, 0));
    return now.getTime() - midnight.getTime();
};

const convertToMs = (timeStamp) => {
    const now = new Date();
    const time = new Date(timeStamp);
    return time - now;
};

const convertToTimestamp = (ms) => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return new Date(midnight.getTime() + ms);
};

const getNextCheckTimeForRealtime = (schedule, currentTime) => {
    const currentDayOfWeek = currentTime.getDay(); // Sunday - 0, Monday - 1, etc.
    const currentTimeSinceMidnight = msSinceMidnight();

    // next time today that's after the current time
    let nextTimeToday = schedule.realTimes
        .filter((time) => time.day === currentDayOfWeek)
        .sort((a, b) => a.time - b.time)
        .find((time) => time.time > currentTimeSinceMidnight);

    // there's a time today after now, return it
    if (nextTimeToday) {
        return new Date(
            currentTime.getFullYear(),
            currentTime.getMonth(),
            currentTime.getDate(),
            0, 0, 0, nextTimeToday.time
        );
    }

    // no time today, find the next scheduled day after today
    let daysAhead = schedule.realTimes
        .filter((time) => time.day > currentDayOfWeek)
        .sort((a, b) => a.day - b.day || a.time - b.time);

    // found a day ahead this week, return the next scheduled time
    if (daysAhead.length > 0) {
        nextTimeToday = daysAhead[0];
        let nextDate = new Date(currentTime);
        nextDate.setDate(nextDate.getDate() + (nextTimeToday.day - currentDayOfWeek));
        return new Date(
            nextDate.getFullYear(),
            nextDate.getMonth(),
            nextDate.getDate(),
            0, 0, 0, nextTimeToday.time
        );
    }

    // loop back to the next week, finding the earliest time available
    daysAhead = schedule.realTimes
        .sort((a, b) => a.day - b.day || a.time - b.time);
    nextTimeToday = daysAhead[0];
    let daysToAdd = (7 - currentDayOfWeek) + nextTimeToday.day;
    let nextDate = new Date(currentTime);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        0, 0, 0, nextTimeToday.time
    );
};

// returns final nextCheckTime after checking for throttle and maintenance window
const getNextCheckTime = async ({ alertId }) => {
    const alert = await Alert.findById(alertId).lean();
    const { schedule, condition, action } = alert;

    let nextCheckTime = new Date();

    if (schedule.type === "scheduled") {
        nextCheckTime = new Date(nextCheckTime.getTime() + schedule.frequency);
    } else if (schedule.type === "realtime") {
        nextCheckTime = getNextCheckTimeForRealtime(schedule, nextCheckTime);
    }

    const triggerOptions = condition.triggerOptions;
    const {isThrottled, throttleEndTime} = isThrottled(nextCheckTime, triggerOptions);
    if (isThrottled) {
        nextCheckTime = new Date(throttleEndTime);
    }

    if (action.activeMaintenance) {
        const { isMW, maintenanceWindow } = isMaintenanceWindow(
            nextCheckTime,
            action
        );
        if (isMW) {
            nextCheckTime = maintenanceWindow.end;
        }
    }

    return nextCheckTime;
};

module.exports = { getNextCheckTime, msSinceMidnight, convertToMs, convertToTimestamp};
