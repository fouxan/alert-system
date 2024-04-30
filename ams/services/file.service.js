const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

//TODO: Adjust directory as necessary
const LOG_DIR = path.join(__dirname, '../logs'); // Adjust directory as necessary
const MAX_FILE_SIZE = 5 * 1024 * 1024; //5MB

function compressLogFile(filePath) {
    const gzip = zlib.createGzip();
    const source = fs.createReadStream(filePath);
    const destination = fs.createWriteStream(`${filePath}.gz`);
    
    source.pipe(gzip).pipe(destination).on('finish', () => {
        console.log(`Compressed log file: ${filePath}`);
        fs.unlinkSync(filePath);
    });
}

function checkLogFiles() {
    fs.readdir(LOG_DIR, (err, files) => {
        if (err) {
            console.error('Failed to read log directory:', err);
            return;
        }
        
        files.forEach(file => {
            const filePath = path.join(LOG_DIR, file);
            const stats = fs.statSync(filePath);
            
            if (stats.size >= MAX_FILE_SIZE) {
                compressLogFile(filePath);
            }
        });
    });
}

module.exports = { checkLogFiles, compressLogFile };
