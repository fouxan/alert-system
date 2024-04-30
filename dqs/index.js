require("dotenv").config();
const { connectDB } = require("./services/db.service");
const { initProducer, initConsumer } = require("./services/kakfa.service");
const { processMessage } = require("./controllers/message.controller");

(async () => {
    try {
        await connectDB();
        const producer = await initProducer();
        const consumer = await initConsumer("triggers", "dqs-group");

        consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await processMessage({ message, producer, partition });
            }
        });

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
