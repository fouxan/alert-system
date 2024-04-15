const moment = require("moment-timezone");
const User = require("../models/user.model");


function isUserAvailable(userId) {
    const user = User.findById(userId);
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
