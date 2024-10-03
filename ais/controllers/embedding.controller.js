const { Worker } = require("worker_threads");
const path = require("path");

exports.createEmbeddings = async (req, res) => {
    const { logData, temId, storeId } = req.body;
    try {
        if (!temId || !storeId || !logData) {
            return res.status(400).json({
                error: "TEM ID, Store ID, and Log Data are required",
            });
        }
        const workerData = {
            temId,
            storeId,
            logData,
        };
        const worker = new Worker(
            path.resolve(__dirname, "../workers/embed.worker.js"),
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
        res.status(200).json({ message: "Embeddings started" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
