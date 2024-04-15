const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "ats-client",
    brokers: ["localhost:9092"],
});

module.exports = { kafka };
