const Alert = require("../models/alert.model");
const { sendToKafka } = require("../services/kafka.service");

const mapDatabaseTypeToPartition = (type) => {
    switch (type) {
        case "mysql":
            return 0;
        case "mongodb":
            return 1;
        case "postgres":
            return 2;
        case "elasticsearch":
            return 3;
        default:
            return 0;
    }
};

const processAlerts = async () => {
    const alerts = await Alert.find({
        "alerts.nextCheckTime": { $lte: new Date() },
        "alerts.status": "running",
    });
    alerts.forEach((alertDoc) => {
        alertDoc.alerts.forEach(async (alert) => {
            const message = {
                actionType:
                    alert.queryExecStatus === "failed" ||
                    alert.queryExecStatus === "paused" ||
                    alert.queryExecStatus === "running"
                        ? "updateNextCheckTime"
                        : alert.actionType,
                alertId: alert._id,
                dbSettings: alert.dbSettings,
            };

            await sendToKafka(
                "triggers",
                [message],
                mapDatabaseTypeToPartition(alert.dbSettings.type)
            );

            if (
                !(
                    alert.queryExecStatus === "failed" ||
                    alert.queryExecStatus === "paused" ||
                    alert.queryExecStatus === "running"
                )
            ) {
                alert.lastCheckTime = new Date();
                alert.queryExecStatus = "running";
                await alertDoc.save();
            }
        });
    });
};

module.exports = { processAlerts };
