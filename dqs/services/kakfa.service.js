const { kafka } = require("../config/kafka.config");

const initProducer = async () => {
    const producer = kafka.producer();
    await producer.connect();
    console.log("Kafka Producer connected and ready.");
    return producer;
};

const initConsumer = async (topic, groupId) => {
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    console.log(`Kafka Consumer subscribed to ${topic} and ready.`);
    return consumer;
};

module.exports = { initProducer, initConsumer };
