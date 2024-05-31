const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "dqs-client",
    brokers: [process.env.KAFKA_BROKER],
});


module.exports = { kafka };
