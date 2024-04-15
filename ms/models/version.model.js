const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const versionSchema = new Schema(
    {
        versionName: {
            type: String,
            default: `Version ${new Date().toISOString()}`,
        },
        versionDesc: { type: String, default: "No description provided" },
        alertData: { type: Schema.Types.Mixed, required: true },
    },
    { _id: true, timestamps: true }
);

const alertVersionSchema = new Schema(
    {
        alertId: {
            type: Schema.Types.ObjectId,
            ref: "Alert",
            required: true,
            index: true,
        },
        versions: [versionSchema],
    },
    { timestamps: true }
);

const AlertVersion = mongoose.model("AlertVersion", alertVersionSchema);

module.exports = AlertVersion;
