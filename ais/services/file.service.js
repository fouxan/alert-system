const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const axios = require("axios");
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const Document = require("../models/document.model");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const mongoose = require("mongoose");

const fetchDocumentFromSharePoint = async (sharepointUrl, accessToken) => {
	try {
		const response = await axios.get(sharepointUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			responseType: "arraybuffer",
		});
		return response.data;
	} catch (error) {
		throw new Error("Failed to fetch document from SharePoint");
	}
};

const saveFile = async (filePath, data) => {
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, data);
};

const getFileContent = async (filePath) => {
	const ext = path.extname(filePath).toLowerCase();

	if (ext === ".txt") {
		return fs.readFileSync(filePath, "utf-8");
	}

	if (ext === ".pdf") {
		const dataBuffer = fs.readFileSync(filePath);
		const data = await pdf(dataBuffer);
		return data.text;
	}

	if (ext === ".docx") {
		const data = await mammoth.extractRawText({ path: filePath });
		return data.value;
	}

	throw new Error("Unsupported file type");
};

const splitIntoChunks = (text, maxChunkSize = 1024) => {
	return text.match(new RegExp(".{1," + maxChunkSize + "}", "g"));
};

const storeDocumentMetadata = async ({
	workspaceId,
	filePath,
	fileSize,
	isEmbedded,
	documentName,
	sharepointUrl,
	storeId,
	modelId,
}) => {
	const newDocId = new mongoose.Types.ObjectId();
	const document = {
		name: documentName,
		path: filePath,
		isEmbedded,
		embeddedUsing: modelId,
		embeddingsStoredAt: storeId,
		size: fileSize,
		url: sharepointUrl,
		_id: newDocId,
	};

	await Document.updateOne(
		{ workspaceId: workspaceId },
		{ $push: { documents: document } },
		{ upsert: true }
	);

	console.log("New Document", newDocId);
	return newDocId.toString();
};

const updateDocumentEmbeddingStatus = async (
	workspaceId,
	documentId,
	isEmbedded
) => {
	const documentData = await Document.findOne({ workspaceId });
	if (!documentData) {
		throw new Error("Document not found");
	}
	const document = documentData.documents.id(documentId);
	if (!document) {
		throw new Error("Document not found");
	}

	document.isEmbedded = isEmbedded;
	await documentData.save();
};

module.exports = {
	fetchDocumentFromSharePoint,
	saveFile,
	getFileContent,
	splitIntoChunks,
	storeDocumentMetadata,
	updateDocumentEmbeddingStatus,
};
