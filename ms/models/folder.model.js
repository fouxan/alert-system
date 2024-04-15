const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const folderSchema = new Schema({
    name: { type: String, required: true },
    desc: { type: String },
    visibility: {
        type: String,
        required: true,
        enum: ["private", "public"],
        default: "public",
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    deleteKey: Number,
    alerts: [{ type: Schema.Types.ObjectId, ref: "Alert" }],
});


const userFolderSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        folders: [folderSchema],
    },
    { timestamps: true }
);

const Folder = mongoose.model("UserFolder", userFolderSchema);

module.exports = Folder;
