const VectorStore = require("./LCVectorStore");

const createVectorStore = async (storeId, modelId) => {
	const storeIdString = storeId.toString();
	const modelIdString = modelId.toString();
	const vectorStore = new VectorStore(storeIdString, modelIdString);
	await vectorStore.init();
	return vectorStore;
};

module.exports = { createVectorStore };
