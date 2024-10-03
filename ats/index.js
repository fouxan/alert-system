require("dotenv").config();
const { connectDB } = require("./config/db.config");
const { initProducer, initConsumer } = require("./services/kafka.service");
const { initScheduler } = require("./scheduler");

(async () => {
    await connectDB();
    await initScheduler();
    await initProducer();
    await initConsumer();
    console.log("Running ATS...");
})();
