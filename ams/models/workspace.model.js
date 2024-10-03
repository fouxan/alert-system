const mongoose = require("mongoose");
const { Schema } = mongoose;

const memberSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        role: {
            type: String,
            required: true,
            enum: ["creator", "editor", "viewer"],
        },
    },
    { _id: false }
);

const invitationSchema = new Schema(
    {
        token: { type: String, required: true },
        expiry: { type: Date, required: true },
    },
    { _id: false }
);

const ESSettingsSchema = new Schema(
    {
        host: { type: String, required: true },
        port: { type: Number, default: 9200 },
        username: { type: String },
        password: { type: String },
        protocol: { type: String, default: "https" },
        apiVersion: { type: String, default: "7.x" },
        caCertificate: { type: String },
        clientCertificate: { type: String },
        clientKey: { type: String },
        timeout: { type: Number, default: 30000 },
    },
);

const modelSchema = new Schema({
    endpoint: { type: String, required: true }, // The URL of the AI model
    apiKey: { type: String, required: true }, // API key for authentication
    authType: {
        type: String,
        enum: ["apiKey", "oauth", "basic"],
        required: true,
    }, // Type of authentication
    oauthToken: {
        type: String,
        required: function () {
            return this.authType === "oauth";
        },
    },
    username: {
        type: String,
        required: function () {
            return this.authType === "basic";
        },
    },
    password: {
        type: String,
        required: function () {
            return this.authType === "basic";
        },
    },
    headers: { type: Map, of: String }, // Additional headers
    requestMethod: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE"],
        default: "POST",
    }, // HTTP method
    inputFormat: { type: String, required: true }, // Format of input data (e.g., JSON)
    responseFormat: { type: String, required: true }, // Expected response format
    timeout: { type: Number, default: 30000 }, // Timeout for the request
    retryPolicy: { type: Object, default: { retries: 3, delay: 1000 } }, // Retry policy
    threshold: { type: Number }, // Optional threshold for the model
    customHeaders: { type: Map, of: String }, // Additional custom headers
    queryParams: { type: Map, of: String }, // Additional query parameters
});

const vectorStoreSchema = new Schema({
    storeType: {
        type: String,
        enum: ["pinecone", "weaviate", "milvus", "faiss", "chroma"],
        required: true,
    },
    connectionDetails: {
        apiKey: { type: String, required: true },
        endpoint: { type: String, required: true },
        indexName: { type: String, required: true },
        namespace: { type: String },
        additionalOptions: { type: Map, of: String },
    },
    embeddingsSettings: {
        modelType: { type: String, required: true },
        dimensions: { type: Number, required: true },
    },
});

const DataSourceSchema = new Schema({
    type: {
        type: String,
        enum: ["chat", "schedule", "log"],
        required: true,
    },
    dbType: {
        type: String,
        enum: [
            "bigquery",
            "mysql",
            "postgres",
            "clickhouse",
            "elasticsearch",
            "pubsub",
            "kafka",
        ],
        required: true,
    },
    connectionDetails: {
        host: {
            type: String,
            required: function () {
                return [
                    "MySQL",
                    "PostgreSQL",
                    "ClickHouse",
                    "ElasticSearch",
                ].includes(this.dbType);
            },
        },
        port: {
            type: Number,
            required: function () {
                return [
                    "MySQL",
                    "PostgreSQL",
                    "ClickHouse",
                    "ElasticSearch",
                ].includes(this.dbType);
            },
        },
        database: {
            type: String,
            required: function () {
                return ["MySQL", "PostgreSQL", "ClickHouse"].includes(
                    this.dbType
                );
            },
        },
        username: {
            type: String,
            required: function () {
                return [
                    "MySQL",
                    "PostgreSQL",
                    "ClickHouse",
                    "ElasticSearch",
                ].includes(this.dbType);
            },
        },
        password: {
            type: String,
            required: function () {
                return [
                    "MySQL",
                    "PostgreSQL",
                    "ClickHouse",
                    "ElasticSearch",
                ].includes(this.dbType);
            },
        },
        dataset: {
            type: String,
            required: function () {
                return this.dbType === "BigQuery";
            },
        },
        projectId: {
            type: String,
            required: function () {
                return this.dbType === "BigQuery";
            },
        },
        brokers: {
            type: Array,
            required: function () {
                return this.dbType === "Kafka Streams";
            },
        },
        topics: {
            type: Array,
            required: function () {
                return this.dbType === "Kafka Streams";
            },
        },
        groupId: {
            type: String,
            required: function () {
                return this.dbType === "Kafka Streams";
            },
        },
        kafkaTag: {
            type: String,
            required: function () {
                return this.dbType === "Kafka Streams";
            },
        },
        gcpProjectId: {
            type: String,
            required: function () {
                return this.dbType === "PubSub";
            },
        },
        gcpSubscription: {
            type: String,
            required: function () {
                return this.dbType === "PubSub";
            },
        },
        gcpTopic: {
            type: String,
            required: function () {
                return this.dbType === "PubSub";
            },
        },
        gcpTag: {
            type: String,
            required: function () {
                return this.dbType === "PubSub";
            },
        },

        connectionOptions: {
            type: Map,
            of: String,
        },
    },
    enabled: { type: Boolean, default: true },
    active: { type: Boolean, default: false },
});

const dataRetentionSchema = new Schema(
    {
        period: { type: Number, required: true },
        endTime: { type: Date },
    },
    { _id: false }
);

const workspaceSchema = new Schema({
    name: { type: String, required: true },
    desc: String,
    members: [memberSchema],
    invitations: [invitationSchema],
    folders: [{ type: Schema.Types.ObjectId, ref: "Folder" }],
    dataRetention: dataRetentionSchema,
    ESSettings: [ESSettingsSchema],
    models: [modelSchema],
    vectorStores: [vectorStoreSchema],
    sources: [DataSourceSchema],
    deleteKey: Number,
    sendRetentionMail: { type: Boolean, default: false },
});

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
