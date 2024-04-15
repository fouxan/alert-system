const moment = require("moment-timezone");

function isUserAvailable(user) {
    const currentTime = moment().tz(user.timezone);
    const currentDay = currentTime.format("dddd");
    const todaySchedule = user.availability.find(
        (schedule) => schedule.day === currentDay
    );
    if (!todaySchedule) {
        return false;
    }
    const currentHour = currentTime.hour();
    return (
        currentHour >= todaySchedule.startHour &&
        currentHour < todaySchedule.endHour
    );
}

module.exports = { isUserAvailable };
