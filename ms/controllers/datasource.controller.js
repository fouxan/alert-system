const Workspace = require("../models/workspace.model");
const DataSource = require("../models/datasource.model");
const testConnection = require("../helpers/testConnection");
const path = require("path");

exports.createDatasource = async (req, res) => {
  const userId = req.user.id;
  let newDataSource = req.body;
  const { workspaceId } = req.params;
  const cert = req.file;

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const userRole = workspace.members.find(
      (member) => member.userId.toString() === userId,
    )?.role;
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({ message: "Not Authorized" });
    }

    let connectionDetailsJSON = {};
    for (const key in newDataSource) {
      if (
        key !== "type" &&
        key !== "dbType" &&
        key !== "_id" &&
        key !== "cert" &&
        key !== "rejectUnauthorized"
      ) {
        // keys like host, port, node, user, password, caFile, rejectUnauth, serviceKey file etc.
        connectionDetailsJSON[key] = newDataSource[key];
      }
    }
    newDataSource.connectionDetails = connectionDetailsJSON;
    if (cert) {
      newDataSource.connectionDetails.caFilePath = `${req.generatedField}${path.extname(cert.originalname)}`;
      newDataSource.connectionDetails.rejectUnauthorized =
        req.body.rejectUnauthorized || true;
      newDataSource.connectionDetails.ssl = true;
      newDataSource._id = req.generatedField;
    }

    const dataSource = new DataSource(newDataSource);
    const savedDataSource = await dataSource.save();
    workspace.sources.push(savedDataSource._id);
    await workspace.save();

    res.status(201).json({
      message: "Data source added successfully",
      dataSource: savedDataSource,
    });
  } catch (error) {
    console.error("Error creating data source:", error);
    res.status(500).json({
      message: "Failed to create data source",
      error: error.message,
    });
  }
};

exports.updateDatasource = async (req, res) => {
  const userId = req.user.id;
  const { workspaceId, datasourceId } = req.params;
  const updateFields = req.body;

  try {
    const dataSource = await DataSource.findById(datasourceId);

    if (!dataSource) {
      return res.status(404).json({ message: "Data source not found." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const userRole = workspace.members.find(
      (member) => member.userId.toString() === userId,
    )?.role;
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        message: "You do not have permission to update this data source.",
      });
    }

    Object.keys(updateFields).forEach((key) => {
      dataSource[key] = updateFields[key];
    });

    const updatedDataSource = await dataSource.save();

    res.json({
      message: "Data source updated successfully.",
      dataSource: updatedDataSource,
    });
  } catch (error) {
    console.error("Error updating data source:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDatasource = async (req, res) => {
  const userId = req.user.id;
  const { workspaceId, datasourceId } = req.params;

  try {
    const dataSource = await DataSource.findById(datasourceId);

    if (!dataSource) {
      return res.status(404).json({ message: "Data source not found." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const userRole = workspace.members.find(
      (member) => member.userId.toString() === userId,
    )?.role;
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({
        message: "You do not have permission to delete this datasource.",
      });
    }

    await DataSource.findByIdAndDelete(datasourceId);

    workspace.sources = workspace.sources.filter(
      (id) => id.toString() !== datasourceId,
    );
    await workspace.save();

    res.json({
      message: "Data source deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting data source:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDatasource = async (req, res) => {
  const { datasourceId } = req.params;

  try {
    const dataSource = await DataSource.findById(datasourceId);
    if (!dataSource) {
      return res.status(404).json({ message: "Data source not found." });
    }

    res.json(dataSource);
  } catch (error) {
    console.error("Error fetching data source:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.listDatasources = async (req, res) => {
  const { workspaceId } = req.params;

  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "No data sources found." });
    }

    const sources = await DataSource.find({
      _id: { $in: workspace.sources },
    });

    res.json(sources);
  } catch (error) {
    console.error("Error fetching data sources:", error);
    res.status(500).json({ error: error.message });
  }
};

// TODO: Test this for each datasource type
exports.testDatasource = async (req, res) => {
  const { datasourceId } = req.params;

  try {
    const dataSource = await DataSource.findById(datasourceId);
    if (!dataSource) {
      return res.status(404).json({ message: "Data source not found" });
    }

    const connected = await testConnection(dataSource);
    if (connected) {
      res.json({ message: "Connection successful" });
    } else {
      res.status(400).json({ message: "Connection failed" });
    }
  } catch (error) {
    console.error("Error testing data source, connection failed:", error);
    res.status(500).json({ error: error.message });
  }
};
