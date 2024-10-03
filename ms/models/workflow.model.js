const mongoose = require("mongoose");
const { Schema } = mongoose;

// stats are directly obtained from es
const workflowSchema = new Schema({
    name: { type: String, require: true },
    desc: String,
    sourceId: { type: Schema.Types.ObjectId, ref: "DataSource", required: true }, // only kafka or pubsub
    esSettingsId: { type: Schema.Types.ObjectId, ref: "ESSettings", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filters: { type: Array, default: [] },
    storeId: { type: Schema.Types.ObjectId, ref: "VectorStore" }, // if not null, embeddings are enabled
    temId: { type: Schema.Types.ObjectId, ref: "Model" }, // if not null, embeddings are enabled
    configPath: { type: String, default: null },
    status: { type: String, enum: ["created", "running", "paused", "failed"], default: "created" },
});

const Workflow = mongoose.model("Workflow", workflowSchema);

module.exports = Workflow;
