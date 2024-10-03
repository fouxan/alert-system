const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "admin-client",
    brokers: [process.env.KAFKA_BROKER],
});

const admin = kafka.admin();

const init = async () => {
    await admin.connect();
    console.log("Kafka Admin connected and ready.");
    await admin.createTopics({
        topics: [
            { topic: "triggers", numPartitions: 4 },
            { topic: "results", numPartitions: 4 },
            { topic: "schedules", numPartitions: 2 },
            { topic: "es-setups", numPartitions: 2 },
            { topic: "ai-setups", numPartitions: 2 },
            { topic: "logs", numPartitions: 2 },
        ],
    });
    console.log("Kafka Topics: ", await admin.listTopics());
    await admin.disconnect();
};

init().catch((error) => {
    console.error("Failed to create topics:", error);
    process.exit(1);
});
