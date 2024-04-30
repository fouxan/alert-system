const { Kafka } = require('kafkajs');

const kafkaConfig = {
    clientId: 'aas-client',
    brokers: [process.env.KAFKA_BROKER]
};

const kafka = new Kafka(kafkaConfig);

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'aas-group' });

module.exports = { kafka, producer, consumer };
