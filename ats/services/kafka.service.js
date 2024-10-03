const { producer, consumer } = require("../config/kafka.config");
const {
  scheduleJob,
  unscheduleJob,
} = require("../controllers/scheduler.controller");
const Alert = require("../models/alert.model");

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
  await consumer.connect();
  await consumer.subscribe({ topic: "schedules", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { alertId, action } = JSON.parse(message.value.toString());
      console.log(`Received message: \nalertId: ${alertId}\naction: ${action}`);

      if (action === "schedule") {
        const alert = await Alert.findById(alertId);
        await scheduleJob(alert);
      } else if (action === "unschedule") {
        await unscheduleJob(alertId);
      }
    },
  });
};

module.exports = { initProducer, initConsumer };
