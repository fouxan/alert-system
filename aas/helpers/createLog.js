const fs = require("fs");
const path = require("path");

const createLog = (type, message, alertId, error) => {
    const logPath = path.join(__dirname, "../logs", "app.log");
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        type, // error, info, debug
        message, // message to log can be query result, error message, etc
        userId, // to get the elastic search details
        alertId, // alertId for front end to get the alert name etc.
        error: error ? { message: error.message, stack: error.stack } : undefined,
    });
    fs.appendFile(logPath, logMessage, (err) => {
        if (err) {
            console.error("Error writing log message: ", err);
        }
    });
}

module.exports = createLog;