const moment = require("moment-timezone");
const User = require("../models/user.model");
const Alert = require("../models/alert.model");

const isUserAvailable = async (userId) => {
    const user = await User.findById(userId);
    console.log("Checking user availability for ", user.username);
    const currentTime = moment().tz(user.timezone);
    const currentDay = currentTime.format("dddd"); // Monday, Tuesday, ...
    const todaySchedule = user.availabilityDetails.find(
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
};

const getEmail = async (userId) => {
    const user = await User.findById(userId);
    return user.email;
};

const getUserList = async (alertId) => {
    const alert = await Alert.findById(alertId).lean();
    if (!alert) {
        throw new Error("Alert not found");
    }
    const userList = new Set();
    const userEmailList = new Map();
    const userSlackList = new Map();
    const userWebexList = new Map();

    const addUser = async (subscription) => {
        const { userId, contactMethods, alertStatus, triggerTimeframe } =
            subscription;
        if (await isUserAvailable(userId)) {
            for (const runningStatus in alert.runningStatuses) {
                if (
                    runningStatus.status === alertStatus &&
                    runningStatus.timeframe === triggerTimeframe
                ) {
                    const { email, slack, webex } = contactMethods;
                    if (email) {
                        userList.add(userId.toString());
                        userEmailList.set(userId.toString(), {
                            email: email.emailId,
                            message: email.message,
                            subject: email.subject,
                            body: email.body,
                            options: email.options,
                        });
                    }
                    if (slack?.token && slack?.channel) {
                        userList.add(userId.toString());
                        userSlackList.set(userId.toString(), {
                            token: slack.token,
                            channel: slack.channel,
                            message: slack.message,
                            blocks: slack.blocks,
                            options: slack.options,
                        });
                    }
                    if (webex?.room && webex?.apiKey) {
                        userList.add(userId.toString());
                        userWebexList.set(userId.toString(), {
                            room: webex.room,
                            apiKey: webex.apiKey,
                            message: webex.message,
                            options: webex.options,
                        });
                    }
                }
            }
        }
    };

    const subscribedUsersList = alert.subscribedUsers.map((subscription) =>
        addUser(subscription)
    );
    await Promise.all(subscribedUsersList);

    const assignedUserList = alert.assignedUsers.map((assignedUser) =>
        addUser(assignedUser)
    );
    await Promise.all(assignedUserList);

    const userDetailList = Array.from(userList).map((userId) => ({
        id: userId,
        email: userEmailList.get(userId.toString()),
        slack: userSlackList.get(userId.toString()),
        webex: userWebexList.get(userId.toString()),
    }));

    console.log("User Detail List: ", userDetailList);
    return userDetailList;
};

module.exports = { getEmail, getUserList };
