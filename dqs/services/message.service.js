const { producer } = require("../config/kafka.config");

let isProducerConnected = false;

const connectProducer = async () => {
    if (!isProducerConnected) {
        try {
            await producer.connect();
            isProducerConnected = true;
            console.log("Connected Producer");
        } catch (error) {
            console.error("Failed to connect producer", error);
            isProducerConnected = false;
        }
    }
};

const sendToKafka = async (topic, messages, partition = null) => {
    try {
        await connectProducer();
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

module.exports = { sendToKafka };
