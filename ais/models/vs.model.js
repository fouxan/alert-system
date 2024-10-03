const mongoose = require("mongoose");
const { Schema } = mongoose;

const pgVectorParamsSchema = new Schema(
    {
        tableName: { type: String, required: true },
        idColumnName: { type: String, default: "id" },
        vectorColumnName: { type: String, default: "vector" },
        metadataColumnName: { type: String, default: "metadata" },
        contentColumnName: { type: String, default: "content" },
    },
    { _id: false }
);

const vectorStoreSchema = new Schema({
    company: {
        type: String,
        enum: ["elasticsearch", "pgvector"],
        required: true,
    },
    connectionDetails: {
        node: { type: String, required: () => this.company == "elasticsearch" },
        username: {
            type: String,
            required: () =>
                (this.company == "elasticsearch" &&
                    !this.connectionDetails.apiKey) ||
                this.company == "pgvector",
        },
        password: {
            type: String,
            required: () =>
                (this.company == "elasticsearch" &&
                    !this.connectionDetails.apiKey) ||
                this.company == "pgvector",
        },
        apiKey: {
            type: String,
            required: () =>
                this.company == "elasticsearch" &&
                !this.connectionDetails.username &&
                !this.connectionDetails.password,
        },
        pgVectorParams: pgVectorParamsSchema,
        endpoint: { type: String },
        indexName: { type: String, required: true },
        namespace: { type: String },
        additionalOptions: { type: Map, of: String },
    },
});

const VectorStore = mongoose.model("VectorStore", vectorStoreSchema);

module.exports = VectorStore;
