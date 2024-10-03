const { parentPort, workerData } = require("worker_threads");
const { createTEM } = require("../classes/AIModel");
const { createVectorStore } = require("../classes/LCVectorStore");
const { updateDocumentEmbeddingStatus } = require("../services/file.service");

(async () => {
	try {
		const {
			temId: modelId,
			storeId,
			workspaceId,
			fileContent,
			documentId,
		} = workerData;
		console.log("Worker data");
		const vectorStore = await createVectorStore(storeId, modelId);
		console.log("Vector store created", vectorStore);
		const tem = await createTEM(modelId);
		console.log("Vector store created");

		const chunks = splitIntoChunks(fileContent);
		console.log("Split into chunks", chunks?.length);

		const embeddings = await tem.embedDocuments(chunks);
		console.log("Embeddings created", embeddings?.length);
		await vectorStore.addVectors(embeddings);
		console.log("Vectors added to store");

		await updateDocumentEmbeddingStatus(workspaceId, documentId, true);
		console.log("Document embedding status updated");

		parentPort.postMessage({ status: "done" });
	} catch (error) {
		console.error("Error in embedding worker:", error);
		parentPort.postMessage({ status: "error", error: error.message });
	}
})();
