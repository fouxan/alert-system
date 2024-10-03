const Model = require("../../models/model.model");
const { ChatAnthropic } = require("@langchain/anthropic");
const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai"); // is also used for azure openai
const { ChatCohere } = require("@langchain/cohere");
const { ChatMistralAI, MistralAIEmbeddings } = require("@langchain/mistralai");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const {
	TogetherAIEmbeddings,
} = require("@langchain/community/embeddings/togetherai");
const {
	ChatGoogleGenerativeAI,
	GoogleGenerativeAIEmbeddings,
} = require("@langchain/google-genai");
const mongoose = require("mongoose");

class AIModel {
	constructor(modelId) {
		this.modelId = modelId;
		this.settings = null;
		this.company = null;
		this.type = null;
		this.model = null;
	}

	async init() {
		console.log("Model ID: ", this.modelId);
		const model = await Model.findById(this.modelId).maxTimeMS(40000);
		if (!model) {
			throw new Error(`Model not found with modelId: ${this.modelId}`);
		}
		console.log("here");

		this.company = model.company;
		this.type = model.type;
		console.log("Model type: ", this.type);
		console.log("Model company: ", this.company);
		// Extract settings, excluding 'company' and 'type'
		// TODO: Add more settings as needed
		this.settings = {
			model: model.name,
			apiKey: model.apiKey,
		};
	}

	async getLLM() {
		if (!this.settings) {
			await this.init();
		}
		if (this.type !== "llm") {
			throw new Error("Not an LLM");
		}
		switch (this.company) {
			case "openai":
			case "azure-openai":
				this.model = new ChatOpenAI(this.settings);
				break;
			case "mistralai":
				this.model = new ChatMistralAI(this.settings);
				break;
			case "ollama":
				this.model = new ChatOllama(this.settings);
				break;
			case "anthropic":
				this.model = new ChatAnthropic(this.settings);
				break;
			case "cohere":
				this.model = new ChatCohere(this.settings);
				break;
			case "google-genai":
				this.model = new ChatGoogleGenerativeAI(this.settings);
				break;
			default:
				throw new Error(`Unsupported model company: ${this.company}`);
		}
		return this.model;
	}

	async getTEM() {
		if (!this.settings) {
			console.log("here");
			const model = await Model.findById(this.modelId).maxTimeMS(40000);
			console.log("Model: ", model);
			await this.init();
		}
		if (this.type !== "embedding") {
			throw new Error("Not a TEM");
		}

		switch (this.company) {
			case "openai":
			case "azure-openai":
				this.model = new OpenAIEmbeddings(this.settings);
				break;
			case "mistralai":
				this.model = new MistralAIEmbeddings(this.settings);
				break;
			case "ollama":
				this.model = new OllamaEmbeddings(this.settings);
				break;
			case "togetherai":
				this.model = new TogetherAIEmbeddings(this.settings);
				break;
			case "google-genai":
				this.model = new GoogleGenerativeAIEmbeddings(this.settings);
				break;
			default:
				throw new Error(`Unsupported model company: ${this.company}`);
		}
		return this.model;
	}

	async embedQuery(text) {
		if (!this.model) {
			throw new Error("Model not initialized");
		}
		return await this.model.embedQuery(text);
	}

	async embedDocuments(texts) {
		if (!this.model) {
			throw new Error("Model not initialized");
		}
		return await this.model.embedDocuments(texts);
	}
}

module.exports = AIModel;
