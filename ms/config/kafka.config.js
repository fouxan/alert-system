const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "ms-client",
    brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

module.exports = { kafka, producer };
