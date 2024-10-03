const { Client } = require("@elastic/elasticsearch");
const {
	ElasticVectorSearch,
} = require("@langchain/community/vectorstores/elasticsearch");
const { createTEM } = require("../AIModel");
const { PGVectorStore } = require("@langchain/community/vectorstores/pgvector");
const VectorStore = require("../../models/vs.model");

class LCVectorStore {
	constructor(storeId, modelId) {
		this.storeId = storeId;
		this.modelId = modelId;
		this.vectorStore = null;
		this.settings = null;
		this.company = null;
	}

	async loadSettings() {
		const store = await VectorStore.findById(this.storeId);
		if (!store) {
			throw new Error(`Store not found with storeId: ${this.storeId}`);
		}

		this.company = store.company;
		this.settings = {};

		for (const key in store.connectionDetails) {
			if (store.connectionDetails[key] !== null && key !== "company") {
				this.settings[key] = store.connectionDetails[key];
			}
		}
	}

	async init() {
		await this.loadSettings();

		const tem = await createTEM(this.modelId);
		let {
			node, // for es
			host, // for pg
			port, // for pg
			apiKey, // for es
			indexName, // for es
			pgVectorParams, // for pg
			username, // for es and pg
			password, // for es and pg
		} = this.settings;
		switch (this.company) {
			case "pgvector":
				const vectorConfig = {
					postgresConnectionOptions: {
						type: "postgres",
						host: host,
						port: port,
						user: username,
						password: password,
						database: database,
					},
					tableName: pgVectorParams.tableName,
					columns: {
						idColumnName: pgVectorParams.idColumnName,
						vectorColumnName: pgVectorParams.vectorColumnName,
						metadataColumnName: pgVectorParams.metadataColumnName,
						contentColumnName: pgVectorParams.contentColumnName,
					},
				};
				this.vectorStore = new PGVectorStore.initialize(tem, vectorConfig);
				break;
			case "elasticsearch":
				const clientOptions = {
					node,
					auth: apiKey
						? { apiKey }
						: username && password
						? { username, password }
						: undefined,
				};

				if (!clientOptions.auth) {
					throw new Error("No authentication provided");
				}
				const clientArgs = new ElasticClientArgs({
					client: new Client(clientOptions),
					indexName: indexName,
				});
				this.vectorStore = new ElasticVectorSearch(tem, clientArgs);
				break;
			default:
				throw new Error(`Unsupported vector store type: ${type}`);
		}
	}

	async similaritySearch(query, topK) {
		if (!this.vectorStore) {
			await this.init();
		}
		return this.vectorStore.similaritySearch(query, topK);
	}

	async addDocuments(documents) {
		if (!this.vectorStore) {
			await this.init();
		}
		return this.vectorStore.addDocuments(documents);
	}

	async addVectors(vectors) {
		if (!this.vectorStore) {
			await this.init();
		}
		return this.vectorStore.addVectors(vectors);
	}

	async deleteVectors(ids) {
		if (!["elasticsearch", "pinecone", "chroma"].includes(this.type)) {
			throw new Error(
				`Unsupported vector store type for deletion: ${this.type}`
			);
		}
		if (!this.vectorStore) {
			await this.init();
		}
		return this.vectorStore.delete({ ids });
	}
}

module.exports = LCVectorStore;
