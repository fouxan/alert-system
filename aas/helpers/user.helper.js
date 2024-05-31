const moment = require("moment-timezone");
const User = require("../models/user.model");
const Alert = require("../models/alert.model");
const Team = require("../models/team.model");

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

const getUserList = async ({ alertId }) => {
    const alert = await Alert.findById(alertId).lean();
    if(!alert){
        throw new Error("Alert not found");
    }
    const userList = new Set();
    const userEmailList = new Set();

    const userAvailabilityChecks = alert.subscribedUsers.map(async (subscription) => {
        if (await isUserAvailable(subscription.userId)) {
            userList.add(user.userId);
            userEmailList.set(subscription.userId.toString(), email);
        }
    });
    await Promise.all(userAvailabilityChecks); // parallel processing

    const teamMemberChecks = alert.assignedTeams.map(async (team) => {
        const teamDetails = await Team.findById(team.teamId).lean();
        return Promise.all(
            teamDetails.members.map(async (member) => {
                if (await isUserAvailable(member.userId)) {
                    const email = await getEmail(member.userId);
                    userList.add(member.userId);
                    userEmailList.set(member.userId.toString(), email);
                }
            })
        );
    });
    await Promise.all(teamMemberChecks);

    const assignedUserChecks = alert.assignedUsers.map(async (assignedUser) => {
        if (await isUserAvailable(assignedUser.userId)) {
            const email = await getEmail(assignedUser.userId);
            userList.add(assignedUser.userId);
            userEmailList.set(assignedUser.userId.toString(), email);
        }
    });
    await Promise.all(assignedUserChecks);

    const userDetailList = Array.from(userList).map(userId => ({
        id: userId,
        email: userEmailList.get(userId.toString())
    }));

    console.log("User Detail List: ", userDetailList);
    return userDetailList;
};

module.exports = { getEmail, getUserList };
