const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    permissions: {
        type: String,
        required: true,
        enum: ["editor", "viewer"],
        default: "viewer",
    },
}, { _id: false });

const teamSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    creator: {type: Schema.Types.ObjectId, ref: "User", required: true},
    members: [memberSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;

