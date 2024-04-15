require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const userRoutes = require("./routes/user.routes");
const teamRoutes = require("./routes/team.routes");
const alertRoutes = require("./routes/alert.routes");
const folderRoutes = require("./routes/folder.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const datasourceRoutes = require("./routes/datasource.routes");

const app = express();
const connection_string = process.env.MONGODB_URI;
app.use(express.json());

mongoose
    .connect(connection_string)
    .then(() => console.log("Connected to MongoDB..."))
    .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use("/users", userRoutes);
app.use('/teams', teamRoutes);
app.use('/alerts', alertRoutes);
app.use('/folders', folderRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/datasources', datasourceRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
