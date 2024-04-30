const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resultSchema = new Schema({
    resultCategory: {
        type: String,
        enum: ["snoozed", "acknowledged", "closed", "re-escalated"],
    },
    resultTime: Date,
    resultData: String,
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    annotations: [String],
});

const actionResultsSchema = new Schema({
    alert_id: { type: Schema.Types.ObjectId, ref: "Alert", required: true },
    results: [resultSchema],
});

const ActionResult = mongoose.model("ActionResult", actionResultsSchema);
module.exports = ActionResult;