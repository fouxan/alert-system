const {
    updateQueryExecStatus,
    isActionNeeded,
    getActionDetails,
    getAlertName,
} = require("../helpers/alert.helper");
const { sendAction, notifyUsers } = require("../helpers/action.helper");
const { getUserList } = require("../helpers/user.helper");
const { sendLogs } = require("../helpers/log.helper");
const updateActionResultsAndRunningStatus = require("../helpers/result.helper");

const processTriggerResult = async ({ alertId, result }) => {
    try {
        const userList = await getUserList(alertId);
        const { queryResult, queryStatus } = result;
        const resultId = await updateActionResultsAndRunningStatus({
            alertId: alertId,
            result: queryResult,
            status: queryStatus,
        });
        const alertName = await getAlertName(alertId);
        const actionDetails = await getActionDetails({
            alertId,
            resultId,
            queryResult,
            queryStatus,
        });
        if (queryStatus === "failed") {
            updateQueryExecStatus(alertId, "failed");
            await notifyUsers({
                userList,
                type: "error",
                variables: {
                    alert_name: alertName,
                    result: queryResult,
                },
            });
            return;
        }

        updateQueryExecStatus(alertId, "pending");

        if (!actionDetails.isNeeded) {
            console.log("No action needed for alert", alertId);
            return;
        }
        console.log(
            "Action needed for alert",
            JSON.stringify(actionDetails, null, 2)
        );
        const actionPromises = [];
        for (let i = 0; i < actionDetails.triggerCount; i++) {
            actionPromises.push(sendAction(actionDetails));
        }
        await Promise.all(actionPromises);

        await notifyUsers({
            userList,
            type: "notification",
            variables: {
                alert_name: alertName,
                results: queryResult,
            },
        });

        await sendLogs(alertId, queryResult, queryStatus);
        console.log("Action taken for alert", alertId);
    } catch (error) {
        console.error(
            `Failed to process trigger result for alert ${alertId}:`,
            error
        );
    }
};

module.exports = processTriggerResult;
