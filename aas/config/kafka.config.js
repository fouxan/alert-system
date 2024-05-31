const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: "aas-client",
    brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'aas-group' });

module.exports = { kafka, producer, consumer };
