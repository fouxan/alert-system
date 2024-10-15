const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		throw error;
	}
};

module.exports = { connectDB };
