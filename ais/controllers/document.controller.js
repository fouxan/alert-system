const Document = require("../models/document.model");
const { Worker } = require("worker_threads");
const path = require("path");
const {
	saveFile,
	getFileContent,
	fetchDocumentFromSharePoint,
	storeDocumentMetadata,
} = require("../services/file.service");
const { createVectorStore } = require("../classes/LCVectorStore");
const { createLLM } = require("../classes/AIModel");

const uploadDocument = async (req, res) => {
	const { temId, storeId, workspaceId } = req.params;
	const { sharepointUrl, accessToken } = req.body;
	const file = req.file;

	if (!temId || !storeId || !workspaceId) {
		return res.status(400).json({
			error:
				"Model ID, Store ID, and Workspace ID are required to upload a document",
		});
	}

	const documentsPath = process.env.DOCS_DIR;
	let filePath;
	let fileContent;
	let fileSize;
	let documentName;

	try {
		if (file) {
			filePath = path.join(documentsPath, file.filename);
			// await saveFile(filePath, file.buffer);
			fileContent = await getFileContent(filePath);
			fileSize = file.size;
			documentName = file.originalname;
		} else if (sharepointUrl) {
			const documentData = await fetchDocumentFromSharePoint(
				sharepointUrl,
				accessToken
			);
			documentName = path.basename(sharepointUrl);
			filePath = path.join(documentsPath, documentName);
			await saveFile(filePath, documentData);
			fileContent = documentData.toString("utf-8");
			fileSize = documentData.length;
		} else {
			return res.status(400).json({ error: "Invalid file or SharePoint URL" });
		}

		const docId = await storeDocumentMetadata({
			workspaceId,
			filePath,
			fileSize,
			isEmbedded: false,
			documentName,
			sharepointUrl,
			storeId,
			modelId: temId,
		});

		const workerData = {
			temId,
			storeId,
			workspaceId,
			filePath,
			fileContent,
			documentId: docId,
		};

		const worker = new Worker(
			path.resolve(__dirname, "../workers/embedDoc.worker.js"),
			{ workerData }
		);
		worker.on("error", (error) => {
			console.error("Worker error:", error);
		});
		worker.on("exit", (code) => {
			if (code !== 0) {
				console.error(`Worker stopped with exit code ${code}`);
			}
		});

		res.status(200).json({
			message: "Document uploaded and embedding process started",
			documentId: docId,
		});
	} catch (error) {
		console.error("Error uploading document:", error);
		res.status(500).json({
			error: "Failed to upload and start embedding document",
		});
	}
};

const retryEmbedding = async (req, res) => {
	const { workspaceId, docId } = req.params;

	if (!workspaceId || !docId) {
		return res.status(400).json({ error: "Missing required parameters" });
	}

	try {
		const documentData = await Document.findOne({ workspaceId });
		if (!documentData || !documentData.documents.id(docId)) {
			return res.status(404).json({ error: "Document not found" });
		}

		const document = documentData.documents.id(docId);
		if (document.isEmbedded) {
			return res.status(400).json({ message: "Document already embedded" });
		}

		const workerData = {
			temId: document.embeddedUsing.toString(),
			storeId: document.embeddingsStoredAt.toString(),
			workspaceId,
			filePath: document.path,
			fileContent: await getFileContent(document.path),
			documentId: docId,
		};

		const worker = new Worker(
			path.resolve(__dirname, "../workers/embedDoc.worker.js"),
			{ workerData }
		);
		worker.on("error", (error) => {
			console.error("Worker error:", error);
		});
		worker.on("exit", (code) => {
			if (code !== 0) {
				console.error(`Worker stopped with exit code ${code}`);
			}
		});

		res.status(200).json({
			message: "Document embedding process started",
		});
	} catch (error) {
		console.error("Error retrying embedding:", error);
		res.status(500).json({ error: "Failed to start embedding process" });
	}
};

const chatWithDocument = async (req, res) => {
	const { workspaceId, llmId, temId, storeId, docId } = req.params;
	const { question } = req.body;

	if (!workspaceId || !llmId || !temId || !storeId || !docId || !question) {
		return res.status(400).json({ error: "Missing required parameters" });
	}

	try {
		const documentData = await Document.findOne({ workspaceId });
		if (!documentData || !documentData.documents.id(docId)) {
			return res.status(404).json({ error: "Document not found" });
		}

		const document = documentData.documents.id(docId);
		if (!document.isEmbedded) {
			res.status(400).json({
				message: "Document is still processing. Try later.",
			});
		}
		if (
			document.embeddedUsing.toString() != temId ||
			document.embeddingsStoredAt.toString() != storeId
		) {
			res.status(400).json({ message: "Incompatible TEM or Store" });
		}

		const vectorStore = await createVectorStore(storeId, temId);
		const llm = await createLLM(llmId);

		const relevantChunks = await vectorStore.similaritySearch(question, 5);

		const relevantText = relevantChunks.map((chunk) => chunk.text).join("\n");

		const prompt = `Answer the following question based on the text provided:\n\n${relevantText}\n\nQuestion: ${question}`;

		const response = await llm.invoke(prompt);

		res.status(200).json({ response: response.data });
	} catch (error) {
		console.error("Error in chatWithDocument:", error);
		res.status(500).json({ error: "Failed to process the request" });
	}
};

module.exports = { uploadDocument, retryEmbedding, chatWithDocument };
