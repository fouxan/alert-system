const Alert = require("../models/alert.model");
const {
    getFormattedResults,
    getCsvFile,
} = require("../helpers/formatter.helper");

const isActionNeeded = async ({ alertId, queryResult }) => {
    const alert = await Alert.findById(alertId).lean();
    const conditions = alert.condition;
    let actionNeeded = false;
    let triggerCount = 0;

    if (conditions.trigger === "num_results") {
        if (queryResult.length >= conditions.triggerThreshold) {
            actionNeeded = true;
        }
        if (conditions.triggerSchedule === "every_result") {
            triggerCount = queryResult.length;
        } else {
            triggerCount = 1;
        }
    }
    const type = alert.action.actionType;
    return { actionNeeded, triggerCount, type };
};

const updateQueryExecStatus = async (alertId, status) => {
    try {
        await Alert.findOneAndUpdate(
            { _id: alertId },
            { $set: { queryExecStatus: status } },
            { new: true }
        );
    } catch (error) {
        console.error("Error updating query execution status:", error);
    }
};

const getActionDetails = async ({
    alertId,
    resultId,
    queryResult,
    queryStatus,
}) => {
    const alert = await Alert.findById(alertId).lean();
    if (!alert) {
        throw new Error("Alert not found");
    }
    const { actionNeeded, triggerCount, type } = await isActionNeeded({
        alertId,
        queryResult,
    });
    const actionSettings = alert.action.actionSettings;
    let actionDetails = {
        isNeeded: actionNeeded,
        triggerCount: triggerCount,
        type: type,
        options: {},
    };

    switch (type) {
        case "email":
            if (!actionSettings.email)
                throw new Error("No action details found");
            actionDetails.email = actionSettings.email.to;
            actionDetails.subject = actionSettings.email.subject;
            actionDetails.bodyTemplate = actionSettings.email.body;
            actionDetails.bodyType = actionSettings.email.bodyType;
            options = actionSettings.email.options || {};
            actionDetails.options = options;

            if (options.attachName)
                actionDetails.options.alertName = alert.alertName;
            if (options.attachStatus)
                actionDetails.options.queryStatus = queryStatus;
            if (options.linkToAlert) {
                const workspaceId = alert.workspaceId;
                actionDetails.options.linkToAlert = `${process.env.BASE_URL}/ws/${workspaceId}/a/${alertId}`;
            }
            if (options.linkToResults) {
                const workspaceId = alert.workspaceId;
                actionDetails.options.linkToResults = `${process.env.BASE_URL}/ws/${workspaceId}/a/${alertId}/results/${resultId}`;
            }
            if (options.attachTimestamp)
                actionDetails.options.currentTime = new Date().toLocaleString();
            if (options.attachResults) {
                actionDetails.options.queryResult =
                    getFormattedResults(queryResult);
            }
            if (options.attachResultCount) {
                actionDetails.options.resultCount = queryResult.length;
            }
            if (options.attachCsv) {
                actionDetails.options.csv = getCsvFile(queryResult);
            }
            break;

        case "slack":
            if (!actionSettings.slack)
                throw new Error("No action details found");
            actionDetails.token = actionSettings.slack.token;
            actionDetails.channel = actionSettings.slack.channel;
            actionDetails.message = actionSettings.slack.message;
            options = actionSettings.slack.options || {}; // Initialize options if undefined
            actionDetails.options = options;

            if (options.attachName)
                actionDetails.options.alertName = alert.alertName;
            if (options.attachStatus)
                actionDetails.options.queryStatus = queryStatus;
            if (options.linkToAlert) {
                const workspaceId = alert.workspaceId;
                actionDetails.options.linkToAlert = `${process.env.BASE_URL}/ws/${workspaceId}/a/${alertId}`;
            }
            if (options.linkToResults) {
                const workspaceId = alert.workspaceId;
                actionDetails.options.linkToResults = `${process.env.BASE_URL}/ws/${workspaceId}/a/${alertId}/results/${resultId}`;
            }
            if (options.attachTimestamp)
                actionDetails.options.currentTime = new Date().toLocaleString();
            if (options.attachResults) {
                actionDetails.options.queryResult =
                    getFormattedResults(queryResult);
            }
            if (options.attachResultCount) {
                actionDetails.options.resultCount = queryResult.length;
            }
            if (options.attachCsv) {
                actionDetails.options.csv = getCsvFile(queryResult);
            }
            break;

        case "webex":
            if (!actionSettings.webex)
                throw new Error("No action details found");
            actionDetails.roomId = actionSettings.webex.room;
            actionDetails.apiKey = actionSettings.webex.apiKey;
            actionDetails.message = actionSettings.webex.message;
            options = actionSettings.webex.options || {}; // Initialize options if undefined
            actionDetails.options = options;

            if (options.attachName)
                actionDetails.options.alertName = alert.alertName;
            if (options.attachStatus)
                actionDetails.options.queryStatus = queryStatus;
            if (options.linkToAlert) {
                const workspaceId = alert.workspaceId;
                actionDetails.options.linkToAlert = `${process.env.BASE_URL}/ws/${workspaceId}/a/${alertId}`;
            }
            if (options.linkToResults) {
                const workspaceId = alert.workspaceId;
                actionDetails.options.linkToResults = `${process.env.BASE_URL}/ws/${workspaceId}/a/${alertId}/results/${resultId}`;
            }
            if (options.attachTimestamp)
                actionDetails.options.currentTime = new Date().toLocaleString();
            if (options.attachResults) {
                actionDetails.options.queryResult =
                    getFormattedResults(queryResult);
            }
            if (options.attachResultCount) {
                actionDetails.options.resultCount = queryResult.length;
            }
            if (options.attachCsv) {
                actionDetails.options.csv = getCsvFile(queryResult);
            }
            break;

        case "webhook":
            if (!actionSettings.webhook)
                throw new Error("No action details found");
            actionDetails.url = actionSettings.webhook.url;
            actionDetails.message = actionSettings.webhook.message;
            break;

        default:
            break;
    }

    console.log("Action Details: ", actionDetails);
    return actionDetails;
};
const getAlertName = async (alertId) => {
    const alert = await Alert.findById(alertId).lean();
    if (!alert) {
        throw new Error("Alert not found");
    }
    return alert.alertName;
};

module.exports = {
    getAlertName,
    updateQueryExecStatus,
    isActionNeeded,
    getActionDetails,
};
