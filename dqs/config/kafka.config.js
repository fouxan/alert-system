const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "dqs-client",
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "dqs-group" });

module.exports = { kafka, producer, consumer };
