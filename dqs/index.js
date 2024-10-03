require("dotenv").config();
const { initProducer, initConsumer } = require("./services/kakfa.service");
const { processMessage } = require("./controllers/query.controller");

(async () => {
  try {
    await initProducer();
    await initConsumer();

    const shutdown = async () => {
      console.log("Shutting down...");
      await producer.disconnect();
      await consumer.disconnect();
      console.log("Kafka services disconnected.");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start DQS:", error);
    process.exit(1);
  }
})();
