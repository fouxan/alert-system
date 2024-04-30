const {
    updateNextCheckTime,
    updateQueryExecStatus,
    isActionNeeded,
    getUserList,
    updateNextCheckTime,
    getActionDetails
} = require("../helpers/alert.helper");
const { sendAction, sendMail } = require("../helpers/action.helper");

const { storeLogs } = require("../helpers/logs.helper");
const { storeActionResult } = require("./result.helper");

// TODO: Test this function
const processTriggerResult = async ({ alertId, result }) => {
    const userList = await getUserList({ alertId });
    const actionDetails = await getActionDetails({ alertId });
    if (result.queryStatus === "failed") {
        updateQueryExecStatus(alertId, "failed");
        await sendMail({
            userList,
            alertId,
            result,
            type: "error",
            actionDetails,
        });
        return;
    } else {
        updateQueryExecStatus(alertId, "success");
    }
    const { actionNeeded, triggerCount, type } = await isActionNeeded({
        alertId,
        result,
    });
    if (!actionNeeded) {
        console.log("No action needed for alert", alertId);
        await storeLogs(alertId, result);
        return;
    }

    for (let i = 0; i < triggerCount; i++) {
        await sendAction({
            alertId,
            result,
            userList,
            type,
            actionDetails,
        });
    }
    await updateNextCheckTime({ alertId });
    await storeLogs(alertId, result);
    await storeActionResult(alertId, result);
    console.log("Action taken for alert", alertId);
};

module.exports = processTriggerResult;
