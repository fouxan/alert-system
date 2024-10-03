const VectorStore = require("./LCVectorStore");

const createVectorStore = async (storeId, modelId) => {
    const vectorStore = new VectorStore(storeId, modelId);
    await vectorStore.init();
    return vectorStore;
};

module.exports = { createVectorStore };
