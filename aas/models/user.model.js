const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const permissionSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "onModel",
        },
        permission: {
            type: String,
            required: true,
            enum: ["creator", "editor", "viewer"],
        },
        onModel: {
            type: String,
            required: true,
            enum: ["Team", "Workspace", "Folder"],
        },
    },
    { _id: false }
);

const availabilitySchema = new Schema(
    {
        day: {
            type: String,
            required: true,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
        },
        start: { type: Number, required: true, min: 0, max: 23 },
        end: { type: Number, required: true, min: 0, max: 23 },
    },
    { _id: false }
);

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    desc: String,
    mobileNumber: String,
    timezone: String,
    availability: { type: Boolean, default: true },
    availabilityDetails: {
        type: [availabilitySchema],
        validate: [
            (v) => v.length <= 7,
            "Availability can't be more than 7 days",
        ],
        default: [
            { day: "Monday", start: 9, end: 17 },
            { day: "Tuesday", start: 9, end: 17 },
            { day: "Wednesday", start: 9, end: 17 },
            { day: "Thursday", start: 9, end: 17 },
            { day: "Friday", start: 9, end: 17 },
        ],
    },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    teams: [permissionSchema],
    workspaces: [permissionSchema],
    folders: [permissionSchema],
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("passwordHash")) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
