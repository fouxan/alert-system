const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const keyFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/json', 'application/x-pem-file', 'text/plain'];
  
  // Check by mimetype or file extension (some .pem files are 'text/plain')
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.pem')) {
    cb(null, true);
  } else {
    cb(new Error('Only JSON and PEM files are allowed'), false);
  }
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = process.env.KEYFILE_DIR;
		// Check if the directory exists, if not, create it
		console.log("File Dir: ", dir);
		fs.access(dir, fs.constants.W_OK, (err) => {
			if (err) {
				fs.mkdir(dir, { recursive: true }, (err) => {
					if (err) {
						return cb(new Error(`Could not create directory: ${err.message}`));
					}
					cb(null, dir);
				});
			} else {
				cb(null, dir);
			}
		});
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const sourceId = new mongoose.Types.ObjectId();
		const filename = `${sourceId}${ext}`;
		req.generatedField = sourceId;
		cb(null, filename);
	},
});

const upload = multer({ keyFileFilter, storage }).single('caFile');

module.exports = upload;
