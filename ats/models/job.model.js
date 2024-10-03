const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobSchema = new Schema({
    alertId: { type: Schema.Types.ObjectId, ref: "Alert", required: true },
    jobId: { type: String, required: true },
    nextRunTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ["scheduled", "running", "completed", "failed"],
        default: "scheduled",
    },
    lastRunTime: Date,
    queryExecStatus: {
        type: String,
        enum: ["pending", "running", "completed", "failed", "paused"],
        default: "pending",
    },
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
