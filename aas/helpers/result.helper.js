const Alert = require("../models/alert.model");
const ActionResult = require("../models/actionResult.model");

const calculateRunningStatus = (triggers, timeframe) => {
    const count = triggers.length;
    if (count <= timeframe.up) {
        return "Up";
    } else if (count <= timeframe.warn) {
        return "Warn";
    } else {
        return "Down";
    }
};

const getTimeframeStart = (timeframe) => {
    const now = new Date();
    switch (timeframe) {
        case "15 mins":
            return new Date(now.getTime() - 15 * 60 * 1000);
        case "1 hr":
            return new Date(now.getTime() - 60 * 60 * 1000);
        case "4 hrs":
            return new Date(now.getTime() - 4 * 60 * 60 * 1000);
        case "12 hrs":
            return new Date(now.getTime() - 12 * 60 * 60 * 1000);
        case "1 day":
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case "7 days":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "14 days":
            return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        case "30 days":
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() - 24 * 60 * 60 * 1000); // default to 1 day
    }
};

const updateActionResultsAndRunningStatus = async ({
    alertId,
    result,
    status,
}) => {
    try {
        const alert = await Alert.findById(alertId);
        if (!alert) {
            throw new Error("Alert not found");
        }

        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        if (!actionResult) {
            throw new Error("ActionResult not found");
        }

        const resultEntry = {
            result: {
                resultData: result,
                resultStatus: status == "success" ? "success" : "failure",
                timestamp: Date.now(),
            },
            actions: {
                actionTaken: "none",
                status: "pending",
            },
        };

        actionResult.results.push(resultEntry);
        await actionResult.save();

        // Get the ID of the newly added result
        const newResultId =
            actionResult.results[actionResult.results.length - 1]._id;

        const triggerTimeframes = alert.action.triggerTimeframes;
        for (const triggerTimeframe of triggerTimeframes) {
            const { timeframe, alertLevels } = triggerTimeframe;
            const timeframeStart = getTimeframeStart(timeframe);
            const triggersInTimeframe = actionResult.results.filter(
                (result) => result.result.timestamp >= timeframeStart
            );

            const newRunningStatus = calculateRunningStatus(
                triggersInTimeframe,
                alertLevels
            );
            const runningStatusIndex = alert.runningStatuses.findIndex(
                (status) => status.timeframe === timeframe
            );

            if (runningStatusIndex >= 0) {
                alert.runningStatuses[runningStatusIndex].status =
                    newRunningStatus;
            } else {
                alert.runningStatuses.push({
                    timeframe,
                    status: newRunningStatus,
                });
            }

            console.log(
                `Updated running status of alert ${alertId} to ${newRunningStatus}`
            );
        }
        await alert.save();

        return newResultId;
    } catch (error) {
        console.error(
            `Failed to update action results and running status for alert ${alertId}:`,
            error
        );
        throw error; // Rethrow the error so the caller can handle it
    }
};

module.exports = updateActionResultsAndRunningStatus;
