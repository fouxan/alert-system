const mongoose = require("mongoose");
const { Schema } = mongoose;

// finalized
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

//finalized
const invitationSchema = new Schema(
    {
        token: { type: String, required: true },
        expiry: { type: Date, required: true },
    },
    { _id: false }
);

// finalized
const dataRetentionSchema = new Schema(
    {
        period: { type: Number, required: true },
        endTime: { type: Date },
    },
    { _id: false }
);

//finalized
const workspaceSchema = new Schema({
    name: { type: String, required: true },
    desc: String,
    members: [memberSchema],
    invitations: [invitationSchema],
    folders: [{ type: Schema.Types.ObjectId, ref: "Folder" }],
    dataRetention: dataRetentionSchema,
    ESSettings: [{ type: Schema.Types.ObjectId, ref: "ESSettings" }],
    models: [{ type: Schema.Types.ObjectId, ref: "Model" }],
    vectorStores: [{ type: Schema.Types.ObjectId, ref: "VectorStore" }],
    sources: [{ type: Schema.Types.ObjectId, ref: "DataSource" }],
    deleteKey: Number,
    sendRetentionMail: { type: Boolean, default: false },
    workflows: [{ type: Schema.Types.ObjectId, ref: "Workflow" }],
});

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
