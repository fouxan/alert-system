const moment = require("moment-timezone");
const User = require("../models/user.model");


const isUserAvailable = async (userId) => {
    const user = await User.findById(userId);
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

const getEmail = async (userId) => {
    const user = await User.findById(userId);
    return user.email;
}

module.exports = { isUserAvailable, getEmail };
