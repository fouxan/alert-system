const { producer } = require("../config/producer.js");

const initProducer = async () => {
    try {
        await producer.connect();
        console.log("Kafka Producer connected and ready.");
    } catch (error) {
        console.error("Failed to connect producer:", error);
        process.exit(1);
    }
};

const sendToKafka = async (topic, messages, partition) => {
    try {
        await producer.send({ topic, messages, partition });
        console.log("Message sent to Kafka");
    } catch (error) {
        console.error("Error sending message to Kafka:", error);
    }
};

module.exports = { initProducer, sendToKafka };
