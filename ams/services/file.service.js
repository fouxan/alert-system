const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const LOG_DIR = '/app/log';
const FILE_SIZE_LIMIT = 1; // in MB

const compressLogFile = (workspaceId) => {
    const logFilePath = path.join(LOG_DIR, `${workspaceId}-logs.log`);
    const compressedFilePath = `${logFilePath}.gz`;

    const readStream = fs.createReadStream(logFilePath);
    const writeStream = fs.createWriteStream(compressedFilePath);
    const gzip = zlib.createGzip();

    readStream.pipe(gzip).pipe(writeStream).on('finish', (err) => {
        if (err) {
            console.error('Error compressing log file:', err);
        } else {
            console.log(`Log file compressed for workspace ${workspaceId}`);
            fs.unlinkSync(logFilePath); // Remove original log file
        }
    });
};

const checkAndCompressLogFile = (workspaceId) => {
    const logFilePath = path.join(LOG_DIR, `${workspaceId}-logs.log`);
    fs.stat(logFilePath, (err, stats) => {
        if (err) {
            console.error(`Error getting stats for file ${logFilePath}:`, err);
            return;
        }

        const fileSizeInBytes = stats.size;

        if (fileSizeInBytes > FILE_SIZE_LIMIT) {
            compressLogFile(workspaceId);
        }
    });
};

const createLogFile = (workspaceId) => {
    const logFilePath = path.join(LOG_DIR, `${workspaceId}-logs.log`);
    fs.writeFileSync(logFilePath, '');
    console.log(`Log file created for workspace ${workspaceId}`);
};

function deleteLogFiles(workspaceId) {
    const logFile = path.join(LOG_DIR, `${workspaceId}-logs.log`);
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

module.exports = { checkAndCompressLogFile, createLogFile, deleteLogFiles };
