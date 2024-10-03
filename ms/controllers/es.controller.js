const Workspace = require("../models/workspace.model");
const ESSettings = require("../models/es.model");

exports.addESSetting = async (req, res) => {
  const { workspaceId } = req.params;
  const esSettingData = req.body;
  const userId = req.user.id;
  const caFile = req.file;

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userRole = workspace.members.find(
      (member) => member.userId.toString() === userId,
    )?.role;
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (caFile) {
      esSettingData.caFilePath = `/app/data/storage/files/${req.generatedField}${path.extname(caFile.orginalname)}`;
      esSettingData._id = req.generatedField;
    }
    const newESSetting = new ESSettings(esSettingData);
    const savedESSetting = await newESSetting.save();
    workspace.ESSettings.push(savedESSetting._id);
    await workspace.save();

    res.status(201).json({
      message: "ESSetting added",
      esSetting: savedESSetting,
    });
  } catch (error) {
    console.error("Error adding ESSetting:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateESSettings = async (req, res) => {
  const { esSettingId, workspaceId } = req.params;
  const updateFields = req.body;
  const userId = req.user.id;

  try {
    const esSetting = await ESSettings.findById(esSettingId);
    if (!esSetting) {
      return res.status(404).json({ message: "ESSetting not found" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userRole = workspace.members.find(
      (member) => member.userId.toString() === userId,
    )?.role;
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({ message: "Not authorized" });
    }

    Object.keys(updateFields).forEach((key) => {
      esSetting[key] = updateFields[key];
    });

    const updatedESSetting = await esSetting.save();

    res.json({ message: "ESSetting updated", esSetting: updatedESSetting });
  } catch (error) {
    console.error("Error updating ESSetting:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteESSetting = async (req, res) => {
  const { workspaceId, esSettingId } = req.params;
  const userId = req.user.id;

  try {
    const esSetting = await ESSettings.findById(esSettingId);
    if (!esSetting) {
      return res.status(404).json({ message: "ESSetting not found" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userRole = workspace.members.find(
      (member) => member.userId.toString() === userId,
    )?.role;
    if (!userRole || userRole === "viewer") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await ESSettings.findByIdAndDelete(esSettingId);

    workspace.ESSettings = workspace.ESSettings.filter(
      (id) => id.toString() !== esSettingId,
    );
    await workspace.save();

    res.json({ message: "ESSetting deleted" });
  } catch (error) {
    console.error("Error deleting ESSetting:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.listESSettings = async (req, res) => {
  const { workspaceId } = req.params;

  try {
    const workspace =
      await Workspace.findById(workspaceId).populate("ESSettings");
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const esSettings = await ESSettings.find({
      _id: { $in: workspace.ESSettings },
    });

    res.json(esSettings);
  } catch (error) {
    console.error("Error listing ESSettings:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getESSetting = async (req, res) => {
  const { esSettingId } = req.params;

  try {
    const esSetting = await ESSettings.findById(esSettingId);
    if (!esSetting) {
      return res.status(404).json({ message: "ESSetting not found" });
    }

    res.json(esSetting);
  } catch (error) {
    console.error("Error getting ESSetting:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.testESSettings = async (req, res) => {
  const { esSettingsId } = req.body;
  try {
    const esSettings = await ESSettings.findById(esSettingsId);
    if (!esSettings) {
      return res
        .status(404)
        .json({ message: "Elasticsearch settings not found." });
    }
    const connected = await testConnection({
      connectionDetails: esSettings,
      dbType: "elasticsearch",
    });
    if (connected) {
      res.json({ message: "Connection successful" });
    } else {
      res.status(400).json({ message: "Connection failed" });
    }
  } catch (error) {
    console.error("Error testing Elasticsearch setup: ", error);
    return res.status(500).json({ error: error.message });
  }
};
