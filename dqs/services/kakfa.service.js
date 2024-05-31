const { kafka } = require("../config/kafka.config");

const initProducer = async () => {
    try {
        const producer = kafka.producer();
        await producer.connect();
        console.log("Kafka Producer connected and ready.");
    } catch (error) {
        console.error("Failed to connect producer:", error);
        process.exit(1);
    }
};

const initConsumer = async (topic, groupId) => {
    try {
        const consumer = kafka.consumer({ groupId });
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });
        console.log(`Kafka Consumer subscribed to ${topic} and ready.`);
        return consumer;
    } catch (error) {
        console.error("Failed to connect consumer:", error);
        process.exit(1);
    }
};

const sendToKafka = async() => {};

module.exports = { initProducer, initConsumer };
