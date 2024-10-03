require("dotenv").config();
const { connectDB } = require("./config/db.config");
const { runConsumer } = require("./controllers/consumer.controller");

// TODO: add code to update runningStatus
connectDB()
    .then(runConsumer)
    .catch((err) => {
        console.error("Startup failed:", err);
        process.exit(1);
    });
