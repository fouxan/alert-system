const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const folderSchema = new Schema({
    name: { type: String, required: true },
    desc: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    visibility: {
        type: String,
        required: true,
        enum: ["private", "public"],
        default: "public",
    },

    alerts: [{ type: Schema.Types.ObjectId, ref: "Alert" }],
});

const workspaceFolderSchema = new Schema(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        folders: [folderSchema],
    },
    { timestamps: true }
);

const Folder = mongoose.model("Folder", workspaceFolderSchema);

module.exports = Folder;
