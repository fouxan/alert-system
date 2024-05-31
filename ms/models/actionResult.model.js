const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const actionNoteSchema = new Schema(
    {
        note: { type: String, required: true },
        noteBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, _id: true }
);

const resultSchema = new Schema({
    actionTaken: {
        type: String,
        enum: ["snoozed", "acknowledged", "closed", "re-escalated", "none"],
        default: "none",
    },
    resultData: Schema.Types.Mixed,
    actionBy: { type: Schema.Types.ObjectId, ref: "User" },
    actionNotes: [actionNoteSchema],
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    },
});

const actionResultsSchema = new Schema({
    alert_id: { type: Schema.Types.ObjectId, ref: "Alert", required: true },
    results: [resultSchema],
});

const ActionResult = mongoose.model("ActionResult", actionResultsSchema);
module.exports = ActionResult;
