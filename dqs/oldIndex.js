require("dotenv").config();
const { kafka } = require("./client");
const mongoose = require("mongoose");
const {
    performMySQLQuery,
    performBQQuery,
    performPGQuery,
} = require("./helpers");

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "dqs-group" });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB:", error);
        process.exit(1);
    }
};

const initKafka = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic: "triggers", fromBeginning: true });
        console.log("Kafka Consumer and Producer connected and ready.");
    } catch (error) {
        console.error("Failed to connect Kafka services:", error);
        process.exit(1);
    }
};

const mapActionTypeToPartition = (actionType) => {
    switch (actionType) {
        case "email":
            return 0;
        case "slack":
            return 1;
        case "webex":
            return 2;
        case "webhook":
            return 3;
        default:
            return 0;
    }
};

const sendMessageToAAS = async ({ alertId, result, actionType }) => {
    const partition = mapActionTypeToPartition(actionType);

    await producer.send({
        topic: "results",
        messages: [{ value: Buffer.from(JSON.stringify({ alertId, result })) }],
        partition: partition,
    });
};

const processMessage = async ({ message, partition }) => {
    console.log(
        `Received message on partition ${partition}:`,
        message.value.toString()
    );

    const { alertId, dbSettings, actionType } = JSON.parse(
        message.value.toString()
    );
    console.log(`Alert ID: ${alertId}, DB Settings:`, dbSettings);

    try {
        let result;
        switch (partition) {
            case 0:
                result = await performMySQLQuery(dbSettings);
                break;
            case 1:
                result = await performBQQuery(dbSettings);
                break;
            case 2:
                result = await performPGQuery(dbSettings);
                break;
            default:
                throw new Error("Unsupported partition");
        }
        console.log(`Query result:`, result);

        await sendMessageToAAS({ alertId, result });
    } catch (error) {
        console.error(`Query execution failed:`, error);

        await sendMessageToAAS({
            alertId,
            result: { error: error.message, stack: error.stack },
        });
    }
};

const run = async () => {
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            await processMessage({ partition, message });
        },
    });
};

const shutdown = async () => {
    console.log("Shutting down...");
    await producer.disconnect();
    await consumer.disconnect();
    await mongoose.disconnect();
    console.log("All services disconnected.");
};


process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

(async () => {
    try {
        await producer.connect();
        await run();
    } catch (error) {
        console.error(error);
    }
})();

(async () => {
    try {
        await connectDB();
        await initKafka();
        await run();
    } catch (error) {
        console.error(error);
    }
})
