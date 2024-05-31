require("dotenv").config();
const { connectDB } = require("./config/db.config");
const { initProducer } = require("./services/kafka.service");
const { processAlerts } = require("./controllers/alert.controller");
const cron = require("node-cron");

(async () => {
    await connectDB();
    const producer = initProducer();
    cron.schedule("* * * * *", async () => {
        console.log("Running alert check...");
        await processAlerts();
    });
})();
