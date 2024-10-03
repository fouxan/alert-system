const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "ats-client",
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "ats-group" });

module.exports = { kafka, producer, consumer };
