const mongoose = require("mongoose");
const { Schema } = mongoose;

const modelSchema = new Schema({
    endpoint: { type: String },
    type: { type: String, enum: ["llm", "embeddings"], required: true },
    company: {
        type: String,
        enum: [
            "openai",
            "mistralai",
            "ollama",
            "anthropic",
            "cohere",
            "google-genai",
            "azure-openai",
            "togetherai",
        ],
        required: true,
    },
    apiKey: { type: String, required: () => this.company != "ollama" },
    name: { type: String, required: true },
    seed: { type: Number },
    timeout: { type: Number, default: 30000 },
    temperature: { type: Number },
    maxTokens: { type: Number },
    baseUrl: { type: String },
    format: { type: String },
    headers: { type: Map, of: String },
    keepAlive: { type: Boolean, default: false },
    apiVersion: { type: String },
    instanceName: { type: String },
    deploymentName: { type: String },
    basePath: { type: String },
});

const Model = mongoose.model("Model", modelSchema);

module.exports = Model;
