const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const chatRoutes = require("./routes/chat.routes");
const docRoutes = require("./routes/document.routes");

const app = express();
const connection_string = process.env.MONGODB_URI;
// console.log("Connection String: ", connection_string);
app.use(express.json());

mongoose
	.connect(connection_string, { maxPoolSize: 10 })
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err));
// mongoose.set("bufferCommands", false);

app.use("/ws", chatRoutes);
app.use("/ws", docRoutes);
app.get("/health", (req, res) => {
	res.send("OK");
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
