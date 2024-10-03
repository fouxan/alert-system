const fs = require("fs");
const path = require("path");

const LOG_DIR = "/app/log";

const createLogFile = (logFilePath) => {
    fs.writeFileSync(logFilePath, "");
    console.log(`Log file created for workspace ${workspaceId}`);
};

function deleteLogFiles(workspaceId, source) {
    const logFile = path.join(LOG_DIR, `${workspaceId}-${source}-logs.log`);
    const compressedLogFile = `${logFile}.gz`;

    [logFile, compressedLogFile].forEach((file) => {
        if (fs.existsSync(file)) {
            fs.unlink(file, (err) => {
                if (err) {
                    console.error(`Error deleting file ${file}:`, err);
                } else {
                    console.log(`Deleted log file: ${file}`);
                }
            });
        }
    });
}

const handleLogSetup = (workspaceId, action) => {
    const logFile = path.join(LOG_DIR, `${workspaceId}-logs.log`);
    if (action === "create") {
        createLogFile(logFile);
    } else if (action === "delete") {
        deleteLogFiles(workspaceId, source);
    } else if (action === "refresh") {
        deleteLogFiles(workspaceId, source);
        createLogFile(logFile);
    }
};

const writeLog = (alertId, queryResults, queryStatus) => {
    const logFile = path.join(LOG_DIR, `${alertId}-logs.log`);
    const logContent = {
        results: queryResults,
        timestamp: new Date().toISOString(),
        length: queryResults.length,
        status: queryStatus,
    };
    fs.appendFileSync(logFile, `${logContent}\n`);
};

module.exports = { writeLog };
