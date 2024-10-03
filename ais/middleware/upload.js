const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = process.env.DOCS_DIR;
		// Check if the directory exists, if not, create it
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

const upload = multer({ storage });

module.exports = upload;
