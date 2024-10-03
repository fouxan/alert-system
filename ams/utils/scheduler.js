const cron = require("node-cron");
const { checkDataRetention } = require("../services/retention.service");
const { checkAndCompressLogFile } = require("../services/logfile.service");
const { updateExpiredAlerts } = require("../services/alert.service");
const Workflow = require("../models/workflow.model");
const Alert = require("../models/alert.model");

const scheduleTasks = () => {
    cron.schedule("0 * * * *", async () => {
        // Run every hour
        console.log("Running scheduled tasks...");
        await updateExpiredAlerts();
        await checkDataRetention();
    });

    cron.schedule("*/5 * * * *", async () => {
        // Run every 5 minutes
        console.log("Checking log files for compression...");
        const workflows = await Workflow.find({});
        const alerts = await Alert.find({});
        workflows.forEach((workflowId) => {
            checkAndCompressLogFile(workflowId);
        });
        alerts.forEach((alertId) => {
            checkAndCompressLogFile(alertId);
        });
    });
};

module.exports = { scheduleTasks };
