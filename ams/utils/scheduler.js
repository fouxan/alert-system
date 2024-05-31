const cron = require('node-cron');
const { checkDataRetention } = require('../services/retention.service');
const { updateExpiredAlerts } = require('../services/alert.service'); // Assume you have this service
const Workspace = require('../models/workspace.model');
const { checkAndCompressLogFile } = require('../services/file.service');
const { handleConfigFiles } = require('../services/fb.service');

const scheduleTasks = () => {
    cron.schedule('0 0 * * *', () => { // Run daily at midnight
        console.log('Running scheduled tasks...');
        checkDataRetention();
    });

    cron.schedule('* * * * *', async () => { // Run every minute
        console.log('Checking log files for compression...');
        const workspaces = await Workspace.find({});
        workspaces.forEach(workspace => {
            handleConfigFiles(workspace._id);
            updateExpiredAlerts();
            checkAndCompressLogFile(workspace._id);
        });
    });
};

module.exports = { scheduleTasks };
