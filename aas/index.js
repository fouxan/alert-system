const kafka = require("./client");
const Alert = require("../models/alert.model");
const Team = require("../models/team.model");
const ActionResult = require("../models/actionResult.model");
const { sendEmail } = require("../helpers/email");
const { sendWebexMessage } = require("../helpers/webex");
const { sendSlackMessage } = require("../helpers/slack");
const { sendWebhook } = require("../helpers/webhook");
const { isUserAvailable } = require("../helpers/user");
const { isMaintenanceWindow, isThrottle } = require("../helpers/periodCheck");

const run = async () => {
    const consumer = kafka.consumer({ groupId: "aas-group" });
    await consumer.connect();
    await consumer.subscribe({ topic: "results" });

    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            const { alertId, result } = JSON.parse(message.value.toString());
            console.log(`Received result for alert ${alertId}:`, result);
            await processTriggerResult({ message, partition });
        },
    });

    console.log("AAS consumer running...");
};

async function storeActionResult(alertId, resultData) {
    try {
        let actionResult = await ActionResult.findOne({ alert_id: alertId });

        if (actionResult) {
            actionResult.results.push(resultData);
        } else {
            actionResult = new ActionResult({
                alert_id: alertId,
                results: [resultData],
            });
        }

        await actionResult.save();
        console.log(`ActionResult stored for alert ${alertId}`);
    } catch (error) {
        console.error("Error storing ActionResult:", error);
    }
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
    return { actionNeeded, triggerCount };
};

const sendAction = async (actionObject) => {
    switch (actionObject.type) {
        case "email":
            await sendEmail(actionObject);
            break;
        case "webex":
            await sendWebexMessage(actionObject);
            break;
        case "slack":
            await sendSlackMessage(actionObject);
            break;
        case "webhook":
            await sendWebhook(actionObject);
            break;
        default:
            console.log("Unknown action type:", actionObject.type);
    }
};

const takeAction = async ({ actionObject }) => {
    const { triggerCount } = actionObject;
    for (let i = 0; i < triggerCount; i++) {
        await sendAction(actionObject);
    }
};

const getUserList = async ({ alertId }) => {
    const alert = await Alert.findById(alertId).lean();
    const userList = new Set();

    const userAvailabilityChecks = alert.subscribedUsers.map(async (user) => {
        if (await isUserAvailable(user.userId)) {
            userList.add(user.userId);
        }
    });
    await Promise.all(userAvailabilityChecks); // parallel processing

    const teams = await Team.find({ _id: { $in: alert.teamIds } }).lean();

    const teamMemberChecks = teams
        .flatMap((team) => team.members)
        .map(async (member) => {
            if (await isUserAvailable(member)) {
                userList.add(member);
            }
        });
    await Promise.all(teamMemberChecks);

    return Array.from(userList);
};

const msSinceMidnight = () => {
    const now = new Date();
    return (
        ((now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds()) *
            1000 +
        now.getMilliseconds()
    );
};

const getNextCheckTimeForRealtime = (schedule, currentTime) => {
    const currentTimeSinceMidnight = msSinceMidnight();
    const nextTimeToday = schedule.realTimes.find(
        (time) => time > currentTimeSinceMidnight
    );

    if (nextTimeToday !== undefined) {
        return new Date(
            currentTime.setMilliseconds(
                currentTimeSinceMidnight + nextTimeToday
            )
        );
    } else {
        const msTillMidnight = 86400000 - currentTimeSinceMidnight;
        const firstTimeTomorrow = schedule.realTimes[0];
        return new Date(
            currentTime.getTime() + msTillMidnight + firstTimeTomorrow
        );
    }
};

// TODO: Fix this function
const getNextCheckTime = async ({ alertId }) => {
    const alert = await Alert.findById(alertId).lean();
    const { schedule, condition, maintenance } = alert;

    let nextCheckTime = new Date();

    if (schedule.type === "scheduled") {
        nextCheckTime = new Date(nextCheckTime.getTime() + schedule.frequency);
    } else if (schedule.type === "realtime") {
        nextCheckTime = getNextCheckTimeForRealtime(schedule, nextCheckTime);
    }

    if (maintenanceWindow && isMaintenanceWindow(nextCheckTime, maintenance)) {
        nextCheckTime = new Date(maintenance.end);
    }

    const triggerOptions = condition.triggerOptions;
    if (isThrottle(nextCheckTime, triggerOptions)) {
        nextCheckTime = new Date(triggerOptions.throttleEndTime);
    }

    return nextCheckTime;
};

// TODO: Test this function
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

// TODO: Fix this function
const processTriggerResult = async ({ alertId, result }) => {
    if(result.length === 0) {
        updateQueryExecStatus(alertId, "failed");
        return;
    }
    const { actionNeeded, triggerCount } = await isActionNeeded({
        alertId,
        result,
    });
    if (!actionNeeded) {
        console.log("No action needed for alert", alertId);
        await storeLogs(alertId, result);
        return;
    }

    const userList = await getUserList({ alertId });
    const nextCheckTime = await getNextCheckTime({ alertId });

    const actionObject = {
        alertId,
        result,
        userList,
        nextCheckTime,
        triggerCount,
    };

    await takeAction({ actionObject });
    await storeLogs(alertId, result);
    await storeActionResult(alertId, result);
    console.log("Action taken for alert", alertId);
};

run().catch(console.error);
