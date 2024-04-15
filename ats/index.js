const kafka = require("./client");
const Alert = require("./models/alert.model");
const cron = require("node-cron");

const mapDatabaseTypeToPartition = (type) => {
    switch (type) {
        case "mysql":
            return 0;
        case "mongodb":
            return 1;
        case "postgres":
            return 2;
        default:
            return 0;
    }
};

const run = async () => {
    const producer = kafka.producer();
    await producer.connect();
    console.log("Kafka Producer connected and ready.");

    try {
        const alerts = await Alert.find({
            "alerts.nextCheckTime": { $lte: new Date() },
            "alerts.status": "running",
            "alerts.schedule.expiry": { $gt: new Date() },
        });

        alerts.forEach((alertDoc) => {
            alertDoc.alerts.forEach(async (alert) => {
                if (alert.queryExecStatus === "paused") {
                    alert.queryExecStatus = "pending";
                    await alertDoc.save();
                } else if (
                    alert.nextCheckTime <= new Date() &&
                    alert.status === "running" &&
                    alert.queryExecStatus === "pending" &&
                    alert.schedule.expiry > new Date()
                ) {
                    const partition = mapDatabaseTypeToPartition(
                        alertDoc.dbSettings.type
                    );

                    const messageBuffer = Buffer.from(
                        JSON.stringify({
                            partition,
                            actionType: alertDoc.action.type,
                            alertId: alert._id,
                            dbSettings: alert.dbSettings,
                        })
                    );

                    await producer.send({
                        topic: "triggers",
                        messages: [{ value: messageBuffer, partition }],
                    });
                    console.log("Alert published to Kafka");

                    if (alert.schedule.expiry <= new Date()) {
                        alert.status = "expired";
                        await alertDoc.save();
                    }

                    alert.lastCheckTime = new Date();
                    alert.queryExecStatus = "running";
                    await alertDoc.save();
                }
            });
        });
    } catch (error) {
        console.error("Error processing alerts:", error);
    } finally {
        await producer.disconnect();
    }
};

cron.schedule("* * * * *", () => {
    console.log("Running alert check...");
    run();
});
