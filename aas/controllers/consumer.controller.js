const { consumer } = require("../config/kafka.config");
const processTriggerResult = require("./action.controller");

const shutdown = async () => {
    console.log("AAS Consumer Diconnecting...");
    await consumer.disconnect();
    process.exit(0);
};

const runConsumer = async () => {
    await consumer.connect();
    console.log("AAS consumer running...");

    await consumer.subscribe({ topic: "results" });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const { alertId, result } = JSON.parse(message.value.toString());
            console.log(`Received result for alert ${alertId}:`, result);
            await processTriggerResult({ alertId, result });
        },
    });
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};

module.exports = { runConsumer };
