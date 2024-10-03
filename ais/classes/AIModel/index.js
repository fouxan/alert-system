const AIModel = require("./AIModel");

const createLLM = async (modelId) => {
    const llm = new AIModel(modelId);
    await llm.getLLM();
    return llm.model;
};

const createTEM = async (modelId) => {
    const tem = new AIModel(modelId);
    await tem.getTEM();
    return tem.model;
};

module.exports = { createLLM, createTEM };
