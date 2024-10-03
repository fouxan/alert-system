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

const slackDetailsSchema = new Schema({
	slackId: { type: String, required: true },
	slackToken: { type: String, required: true },
});

const webexDetailsSchema = new Schema({
	roomId: { type: String, required: true },
	webexToken: { type: String, required: true },
});

// TODO: make unique email id
const userSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: true },
	desc: String,
	mobileNumber: String,
	timezone: String,
	availabilityDetails: {
		type: [availabilitySchema],
		validate: [(v) => v.length <= 7, "Availability can't be more than 7 days"],
		default: [
			{ day: "Monday", start: 9, end: 17 },
			{ day: "Tuesday", start: 9, end: 17 },
			{ day: "Wednesday", start: 9, end: 17 },
			{ day: "Thursday", start: 9, end: 17 },
			{ day: "Friday", start: 9, end: 17 },
		],
	},
	slackDetails: [slackDetailsSchema],
	webexDetails: [webexDetailsSchema],
	passwordHash: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
