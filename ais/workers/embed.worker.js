const { parentPort, workerData } = require("worker_threads");
const { createVectorStore } = require("../classes/LCVectorStore");

(async () => {
    try {
        const { temId, storeId, logData } = workerData;

        const vectorStore = await createVectorStore(storeId, temId);
        const documents = logData.map((log) => ({
            pageContent: log.content,
            metadata: log.metadata,
        }));

        console.log(documents);
        await vectorStore.addDocuments(documents);

        parentPort.postMessage({ status: "done" });
    } catch (error) {
        console.error("Error in embedding worker:", error);
        parentPort.postMessage({ status: "error", error: error.message });
    }
})();
