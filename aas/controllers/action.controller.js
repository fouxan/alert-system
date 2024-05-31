const {
    updateNextCheckTime,
    updateQueryExecStatus,
    isActionNeeded,
    getUserList,
    updateNextCheckTime,
    getActionDetails,
    alertExecutionPaused,
} = require("../helpers/alert.helper");
const { sendAction, notifyUsers } = require("../helpers/action.helper");
const {getUserList} = require("../helpers/user.helper");

const { storeLogs } = require("../helpers/logs.helper");
const storeActionResult = require("../helpers/result.helper");

// TODO: Test this function
const processTriggerResult = async ({ alertId, result }) => {
    if (alertExecutionPaused(alertId)) {
        updateQueryExecStatus(alertId, "pending");
        updateNextCheckTime({ alertId });
        return; // skipping any action if the user has paused execution mid way
    }
    const userList = await getUserList({ alertId });
    const actionDetails = await getActionDetails({ alertId });
    const { queryResult, queryStatus } = result;
    // if (queryStatus === "paused") {   
    //     return;
    // }
    if (queryStatus === "failed") {
        updateQueryExecStatus(alertId, "failed");
        await notifyUsers({
            userList,
            alertId,
            result: queryResult,
            type: "error",
        });
        return;
    }

    updateQueryExecStatus(alertId, "pending"); // re init for ats

    const { actionNeeded, triggerCount, type } = await isActionNeeded({
        alertId,
        queryResult,
    });
    if (!actionNeeded) {
        console.log("No action needed for alert", alertId);
        await storeLogs(alertId, queryResult);
        return;
    }

    await storeActionResult(alertId, queryResult);
    await storeLogs(alertId, queryResult);

    for (let i = 0; i < triggerCount; i++) {
        await sendAction({
            alertId,
            queryResult,
            userList,
            type,
            actionDetails,
        });
    }

    await notifyUsers({ userList, alertId, type, actionDetails, queryResult });
    await updateNextCheckTime({ alertId });
    console.log("Action taken for alert", alertId);
};

module.exports = processTriggerResult;
