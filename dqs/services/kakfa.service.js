const { producer, consumer } = require("../config/kafka.config");
const { processMessage } = require("../controllers/query.controller");

const initProducer = async () => {
  try {
    await producer.connect();
    console.log("Kafka Producer connected and ready.");
  } catch (error) {
    console.error("Failed to connect producer:", error);
    process.exit(1);
  }
};

const initConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "triggers", fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await processMessage({ message, partition });
      },
    });
  } catch (error) {
    console.error("Failed to connect consumer:", error);
    process.exit(1);
  }
};

module.exports = { initProducer, initConsumer };
