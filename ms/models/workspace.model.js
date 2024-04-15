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
    { _id: false }
);

const workspaceSchema = new Schema({
    name: { type: String, required: true },
    desc: String,
    members: [memberSchema],
    invitations: [invitationSchema],
    folders: [{ type: Schema.Types.ObjectId, ref: "Folder" }],
    dataRetention: {
        type: Date,
        default: () => Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    ESSettings: ESSettingsSchema,
    deleteKey: Number
});

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
