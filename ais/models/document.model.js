const mongoose = require("mongoose");
const { Schema } = mongoose;

const docSchema = new Schema({
    name: { type: String, required: true },
    path: { type: String, required: true },
    isEmbedded: { type: Boolean, default: false },
    embeddedUsing: { type: Schema.Types.ObjectId, required: true },
    embeddingsStoredAt: { type: Schema.Types.ObjectId, required: true },
    size: { type: Number, require: true },
    url: { type: String },
});

const documentsSchema = new Schema(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        documents: [docSchema],
    },
    { _id: false }
);

const Document = mongoose.model("Document", documentsSchema);

module.exports = Document;
