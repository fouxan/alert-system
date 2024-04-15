const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "aas-client",
    brokers: ["localhost:9092"],
});

module.exports = { kafka };
