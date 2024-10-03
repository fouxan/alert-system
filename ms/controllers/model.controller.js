const Model = require("../models/model.model");
const Workspace = require("../models/workspace.model");

exports.addModel = async (req, res) => {
    const { workspaceId } = req.params;
    const modelData = req.body;
    const userId = req.user.id;

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const userRole = workspace.members.find(
            (member) => member.userId.toString() === userId
        )?.role;
        if (!userRole || userRole === "viewer") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const newModel = new Model(modelData);

        const savedModel = await newModel.save();
        workspace.models.push(savedModel._id);
        await workspace.save();

        res.status(201).json({ message: "Model added", model: savedModel });
    } catch (error) {
        console.error("Error adding model:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateModel = async (req, res) => {
    const { workspaceId, modelId } = req.params;
    const updateFields = req.body;
    const userId = req.user.id;

    try {
        const model = await Model.findById(modelId);
        if (!model) {
            return res.status(404).json({ message: "Model not found" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const userRole = workspace.members.find(
            (member) => member.userId.toString() === userId
        )?.role;
        if (!userRole || userRole === "viewer") {
            return res.status(403).json({ message: "Not authorized" });
        }

        Object.keys(updateFields).forEach((key) => {
            model[key] = updateFields[key];
        });

        const updatedModel = await model.save();

        res.json({ message: "Model updated", model: updatedModel });
    } catch (error) {
        console.error("Error updating model:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteModel = async (req, res) => {
    const { workspaceId, modelId } = req.params;
    const userId = req.user.id;

    try {
        const model = await Model.findById(modelId);
        if (!model) {
            return res.status(404).json({ message: "Model not found" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const userRole = workspace.members.find(
            (member) => member.userId.toString() === userId
        )?.role;
        if (!userRole || userRole === "viewer") {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Model.findByIdAndDelete(modelId);

        workspace.models = workspace.models.filter(
            (id) => id.toString() !== modelId
        );
        await workspace.save();

        res.json({ message: "Model deleted" });
    } catch (error) {
        console.error("Error deleting model:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.listModels = async (req, res) => {
    const { workspaceId } = req.params;

    try {
        const workspace = await Workspace.findById(workspaceId).populate(
            "models"
        );
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const models = await Model.find({ _id: { $in: workspace.models } });

        res.json(models);
    } catch (error) {
        console.error("Error listing models:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getModel = async (req, res) => {
    const { modelId } = req.params;

    try {
        const model = await Model.findById(modelId);
        if (!model) {
            return res.status(404).json({ message: "Model not found" });
        }

        res.json(model);
    } catch (error) {
        console.error("Error getting model:", error);
        res.status(500).json({ message: error.message });
    }
};
