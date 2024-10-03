const { kafka } = require("../config/kafka.config");

const initKafka = async () => {
    try {
        const consumer = kafka.consumer({ groupId: "ls-group" });
        await consumer.connect();
        await consumer.subscribe({ topic: "logs", fromBeginning: true });
        console.log("Kafka Consumer connected and ready.");
        return consumer;
    } catch (error) {
        console.error("Failed to connect to Kafka:", error);
        process.exit(1);
    }
};

module.exports = { initKafka };
