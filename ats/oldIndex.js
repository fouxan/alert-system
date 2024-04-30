require("dotenv").config();
const mongoose = require("mongoose");
const kafka = require("./client");
const Alert = require("./models/alert.model");
const cron = require("node-cron");

const producer = kafka.producer();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    }
};

const initProducer = async () => {
    try {
        await producer.connect();
        console.log("Kafka Producer connected and ready.");
        startCronJob();
    } catch (error) {
        console.error("Failed to connect producer:", error);
        process.exit(1);
    }
};

const startCronJob = () => {
    cron.schedule("* * * * *", async () => {
        console.log("Running alert check...");
        await run();
    });
}

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
    try {
        const alerts = await Alert.find({
            "alerts.nextCheckTime": { $lte: new Date() },
            "alerts.status": "running",
        });

        alerts.forEach((alertDoc) => {
            alertDoc.alerts.forEach(async (alert) => {
                if (alert.queryExecStatus === "paused" || alert.nextCheckTime <= new Date()) {
                    const partition = mapDatabaseTypeToPartition(alert.dbSettings.type);

                    await producer.send({
                        topic: "triggers",
                        messages: [{ value: Buffer.from(JSON.stringify({
                            actionType: alert.actionType,
                            alertId: alert._id,
                            dbSettings: alert.dbSettings,
                        })), partition }],
                    });

                    console.log("Alert published to Kafka");
                    alert.lastCheckTime = new Date();
                    alert.queryExecStatus = "running";
                    await alertDoc.save();
                }
            });
        });
    } catch (error) {
        console.error("Error processing alerts:", error);
    }
};

(async () => {
    await connectDB();
    await initProducer();
})();

process.on("SIGINT", async () => {
    console.log("Disconnecting producer and MongoDB...");
    await producer.disconnect();
    await mongoose.disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("Disconnecting producer and MongoDB...");
    await producer.disconnect();
    await mongoose.disconnect();
    process.exit(0);
});
