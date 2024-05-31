const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "admin-client",
    brokers: [process.env.KAFKA_BROKER]
});

const admin = kafka.admin();

const init = async () => {
    await admin.connect();
    console.log("Kafka Admin connected and ready.");
    await admin.createTopics({
        topics: [
            { topic: "triggers", numPartitions: 4, replicationFactor: 3 },
            { topic: "results", numPartitions: 4, replicationFactor: 3}
        ],
    });
    console.log("Topics [triggers, results] with 4 partitions each created successfully.");
    await admin.disconnect();
};

init().catch(error => {
    console.error("Failed to create topics:", error);
    process.exit(1);
});
