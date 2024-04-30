const Alert = require("../models/alert.model");
const Team = require("../models/team.model");
const { isUserAvailable } = require("./userAvailability.helper");
const {getNextCheckTime} = require("./time.helper");


// shoudl work
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


// shoudl work
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
}


// shoudl work
const getUserList = async ({ alertId }) => {
    const alert = await Alert.findById(alertId).lean();
    if(!alert){
        throw new Error("Alert not found");
    }
    const userList = new Set();
    const userEmails = new Set();

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

// shoudl work
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
}



module.exports = {getNextCheckTime, updateNextCheckTime, updateQueryExecStatus, isActionNeeded, getUserList, takeAction, getActionDetails}