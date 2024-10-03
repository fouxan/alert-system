const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

const emailSchema = new Schema({
    emailId: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    options: { type: Object },
});

const slackDetailsSchema = new Schema({
    channel: { type: String, required: true },
    token: { type: String, required: true },
    message: { type: String, required: true },
    blocks: { type: Object },
    options: { type: Object },
});

const webexDetailsSchema = new Schema({
    roomId: { type: String, required: true },
    webexToken: { type: String, required: true },
});

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    desc: String,
    mobileNumber: String,
    timezone: String,
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
    contactDetails: {
        email: String,
        mobileNumber: String,
    },
    slackDetails: [slackDetailsSchema],
    webexDetails: [webexDetailsSchema],
    passwordHash: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
