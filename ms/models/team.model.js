const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    createdBy: {type: Schema.Types.ObjectId, ref: "User", required: true},
    members: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            permissions: {
                type: String,
                required: true,
                enum: ["editor", "viewer"],
                default: "editor",
            },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
