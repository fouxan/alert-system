const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../services/email.service");
const User = require("../models/user.model");
const generateTempPassword = require("../helpers/generateTempPassword");

exports.createUser = async (req, res) => {
	const {
		username,
		email,
		password,
		desc,
		mobileNumber,
		timezone,
		availabilityDetails,
		slackDetails,
		webexDetails,
	} = req.body;

	try {
		if (!password) {
			return res.status(400).json({ error: "Password is required." });
		}
		if (!email) {
			return res.status(400).json({ error: "Email is required." });
		}
		if (!username) {
			return res.status(400).json({ error: "Username is required." });
		}
		const hashedPassword = await bcrypt.hash(password, 10);

		const userObj = {
			username,
			email,
			passwordHash: hashedPassword,
			desc,
			mobileNumber,
			timezone,
			availabilityDetails,
			slackDetails: slackDetails || [],
			webexDetails: webexDetails || [],
		};

		const user = new User(userObj);
		await user.save();
		await sendEmail({
			to: email,
			templateName: "user-registered",
			variables: {
				user_name: username,
			},
		});
		res.status(201).json({ id: user._id, username, email });
	} catch (error) {
		console.error("Error creating user: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email }).exec();
		if (!user) {
			return res.status(401).json({ error: "Invalid email" });
		}
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if (!isPasswordValid) {
			console.log("Invalid password", password, user.passwordHash);
			return res.status(401).json({ error: "Invalid password" });
		}

		const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
			expiresIn: "4h",
		});
		res.json({ token });
	} catch (error) {
		console.error("Error logging in: ", error);
		res.status(500).json({ error: error.message });
	}
};

// TODO: Use token (link) instead of password
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email }).exec();
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const tempPassword = generateTempPassword();
		user.passwordHash = await bcrypt.hash(tempPassword, 10);
		await user.save();

		const { username } = user;

		await sendEmail({
			to: email,
			templateName: "forgot-password",
			variables: {
				user_name: username,
				new_password: tempPassword,
			},
		});

		res.json({ message: "Temporary password sent to your email." });
	} catch (error) {
		console.error("Error resetting password: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.changePassword = async (req, res) => {
	try {
		const userId = req.user.id;
		const { oldPassword, newPassword } = req.body;
		const user = await User.findById(userId).exec();
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const isPasswordValid = await bcrypt.compare(
			oldPassword,
			user.passwordHash
		);
		if (!isPasswordValid) {
			return res.status(401).json({ error: "Invalid password" });
		}

		user.passwordHash = await bcrypt.hash(newPassword, 10);
		const { email, username } = user;
		await user.save();
		await sendEmail({
			to: email,
			templateName: "field-changed",
			subject: "Nudge password changed",
			variables: {
				user_name: username,
				field_changed: "password",
			},
		});
		res.json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Error changing password: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.getUser = async (req, res) => {
	try {
		const userId = req.user.id;
		console.log(userId);
		const user = await User.findById(userId).exec();
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		res.json({
			username: user.username,
			email: user.email,
			desc: user.desc,
			mobileNumber: user.mobileNumber,
			timezone: user.timezone,
			availabilityDetails: user.availabilityDetails,
		});
	} catch (error) {
		console.error("Error getting user: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.updateUser = async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.findById(userId).exec();
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const { desc, slackDetails, webexDetails, mobileNumber, timezone } =
			req.body;

		if (desc) user.desc = desc;
		if (mobileNumber) user.mobileNumber = mobileNumber;
		if (timezone) user.timezone = timezone;
		if (slackDetails) user.slackDetails.push(slackDetails);
		if (webexDetails) user.webexDetails.push(webexDetails);

		await user.save();
		res.json({ message: "User updated successfully" });
	} catch (error) {
		console.error("Error updating user: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.updateAvailability = async (req, res) => {
	const userId = req.user.id;
	const newAvailabilityDetails = req.body;
	try {
		const user = await User.findById(userId).exec();
		if (!user) {
			return res.status(404).json({ error: "No user found" });
		}
		user.availabilityDetails = newAvailabilityDetails;
		await user.save();
		res.json({
			message: "Availability updated successfully",
			availability: user.availabilityDetails,
		});
	} catch (error) {
		console.error("Error in uodating availability: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.getContactDetails = async (req, res) => {
	const userId = req.user.id;
	try {
		const user = await User.findById(userId).exec();
		if (!user) {
			return res.status(404).json({ error: "No user found" });
		}

		const { email, mobileNumber, slackDetails, webexDetails } = user;
		res.json({ email, mobileNumber, slackDetails, webexDetails });
	} catch (error) {
		console.error("Error getting contact details: ", error);
		res.status(500).json({ error: error.message });
	}
};

// TODO: Implement deleteUser after finalizing stripe
// // deletes user and cancels stripe plan
// exports.cancelPlan = async (req, res) => {};

// TODO: Implement changePlan after finalizing stripe
// // changes stripe plan
// exports.changePlan = async (req, res) => {};
