const { producer, consumer } = require("../config/kafka.config.js");

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


module.exports = { sendToKafka };
