const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const LOG_DIR = process.env.LOGFILE_DIR;
const FILE_SIZE_LIMIT = 1 * 1024 * 1024; // 1 MB in bytes

const compressLogFile = (logFilePath) => {
    const compressedFilePath = `${logFilePath}.gz`;

    const readStream = fs.createReadStream(logFilePath);
    const writeStream = fs.createWriteStream(compressedFilePath);
    const gzip = zlib.createGzip();

    readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on("finish", (err) => {
            if (err) {
                console.error("Error compressing log file:", err);
            } else {
                console.log(`Log file compressed for workspace ${logFilePath}`);
                fs.unlinkSync(logFilePath); // Remove original log file
            }
        });
};

const checkAndCompressLogFile = (workspaceId, source) => {
    const logFilePath = path.join(LOG_DIR, `${workspaceId}-${source}-logs.log`);
    if (fs.existsSync(logFilePath)) {
        fs.stat(logFilePath, (err, stats) => {
            if (err) {
                console.error(
                    `Error getting stats for file ${logFilePath}:`,
                    err
                );
                return;
            }

            if (stats.size > FILE_SIZE_LIMIT) {
                compressLogFile(logFilePath);
                createLogFile(logFilePath);
            }
        });
    }
};

// entity is either a workflow or alert
const createLogFile = (entityId) => {
    const logFilePath = path.join(LOG_DIR, `${entityId}-logs.log`);
    fs.writeFileSync(logFilePath, "");
    console.log(`Log file created for workspace ${workspaceId}`);
};

const deleteLogFiles = (entityId) => {
    const logFilePath = path.join(LOG_DIR, `${entityId}-logs.log`);
    if (fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
        console.log(`Log file deleted for workspace ${workspaceId}`);
    }
}

module.exports = { checkAndCompressLogFile, createLogFile, deleteLogFiles };
