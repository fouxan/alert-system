require('dotenv').config();
const { connectDB } = require('./config/db.config');
const { scheduleTasks } = require('./utils/scheduler');

const startServer = async () => {
    try {
        await connectDB();
        scheduleTasks();
        console.log("AMS started successfully");
    } catch (error) {
        console.error("Failed to start AMS:", error);
        process.exit(1);
    }
};

startServer();
