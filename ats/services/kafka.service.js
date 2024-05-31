const { kafka } = require("../config/kafka.config.js");

let producer;

const initProducer = async () => {
    try {
        producer = kafka.producer();
        await producer.connect();
        console.log("Kafka Producer connected and ready.");
    } catch (error) {
        console.error("Failed to connect producer:", error);
        process.exit(1);
    }
};

const sendToKafka = async (topic, messages, partition = null) => {
    try {
        const messageFormatted = messages.map((msg) => ({
            value: JSON.stringify(msg),
            partition, // This can be undefined, which lets Kafka handle the partitioning
        }));
        await producer.send({ topic, messages: messageFormatted });
        console.log("Message sent to Kafka");
    } catch (error) {
        console.error("Error sending message to Kafka:", error);
    }
};

module.exports = { initProducer, sendToKafka };
