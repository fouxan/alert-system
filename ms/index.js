require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
//reviewed till teams routes
const userRoutes = require("./routes/user.routes");
const teamRoutes = require("./routes/team.routes");
const workspaceRoutes = require("./routes/workspace.routes");

const app = express();
const connection_string = process.env.MONGODB_URI;
app.use(express.json());

mongoose
	.connect(connection_string, { maxPoolSize: 10 })
	.then(() => console.log("Connected to MongoDB..."))
	.catch((err) => console.error("Could not connect to MongoDB...", err));

app.use("/u", userRoutes);
app.use("/t", teamRoutes);
app.use("/ws", workspaceRoutes);
app.get("/health", (req, res) => {
	res.status(200).send("OK");
});

const PORT = process.env.PORT || 5678;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log("Encryption Key: ", process.env.ENCRYPTION_KEY);
	console.log("Signing Key: ", process.env.SIGNING_KEY);
});
