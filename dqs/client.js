const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "dqs-client",
    brokers: ["localhost:9092"],
});

module.exports = { kafka };
