const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const actionNoteSchema = new Schema(
    {
        note: { type: String, required: true },
        noteBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, _id: true }
);

const resultSchema = new Schema(
    {
        resultData: { type: Schema.Types.Mixed, required: true },
        timestamp: { type: Date, default: Date.now },
        resultStatus: {
            type: String,
            enum: ["success", "failure"],
            default: "success",
        },
    },
    { timestamps: true, _id: true }
);

const actionResultsSchema = new Schema({
    alert_id: { type: Schema.Types.ObjectId, ref: "Alert", required: true },
    results: [
        {
            actions: {
                actionTaken: {
                    type: String,
                    enum: [
                        "snoozed",
                        "acknowledged",
                        "closed",
                        "re-escalated",
                        "none",
                    ],
                    default: "none",
                },
                actionBy: { type: Schema.Types.ObjectId, ref: "User" },
                actionNotes: [actionNoteSchema],
                status: {
                    type: String,
                    enum: ["pending", "completed"],
                    default: "pending",
                },
            },
            result: resultSchema,
        },
    ],
});

const ActionResult = mongoose.model("ActionResult", actionResultsSchema);
module.exports = ActionResult;
