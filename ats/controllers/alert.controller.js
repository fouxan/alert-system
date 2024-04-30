const Alert = require("../models/alert.model");
const { sendToKafka } = require("../services/kafka.service");

const mapDatabaseTypeToPartition = (type) => {
    switch (type) {
        case "mysql": return 0;
        case "mongodb": return 1;
        case "postgres": return 2;
        case "elasticsearch": return 3;
        default: return 0;
    }
};

const processAlerts = async () => {
    const alerts = await Alert.find({ "alerts.nextCheckTime": { $lte: new Date() }, "alerts.status": "running" });
    alerts.forEach((alertDoc) => {
        alertDoc.alerts.forEach(async (alert) => {
            if (alert.queryExecStatus === "paused" || alert.nextCheckTime <= new Date()) {
                const partition = mapDatabaseTypeToPartition(alert.dbSettings.type);
                await sendToKafka("triggers", [{ value: Buffer.from(JSON.stringify({
                    actionType: alert.actionType,
                    alertId: alert._id,
                    dbSettings: alert.dbSettings,
                })) }], partition);
                alert.lastCheckTime = new Date();
                alert.queryExecStatus = "running";
                await alertDoc.save();
            }
        });
    });
};

module.exports = { processAlerts };
