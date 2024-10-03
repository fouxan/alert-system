const VectorStore = require("../models/vs.model");
const Workspace = require("../models/workspace.model");

exports.addVectorStore = async (req, res) => {
    const { workspaceId } = req.params;
    const vectorStoreData = req.body;
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

        const newVectorStore = new VectorStore(vectorStoreData);

        const savedVectorStore = await newVectorStore.save();
        workspace.vectorStores.push(savedVectorStore._id);
        await workspace.save();

        res.status(201).json({
            message: "VectorStore added",
            vectorStore: savedVectorStore,
        });
    } catch (error) {
        console.error("Error adding VectorStore:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateVectorStore = async (req, res) => {
    const { workspaceId, vectorStoreId } = req.params;
    const updateFields = req.body;
    const userId = req.user.id;

    try {
        const vectorStore = await VectorStore.findById(vectorStoreId);
        if (!vectorStore) {
            return res.status(404).json({ message: "VectorStore not found" });
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
            vectorStore[key] = updateFields[key];
        });

        const updatedVectorStore = await vectorStore.save();

        res.json({
            message: "VectorStore updated",
            vectorStore: updatedVectorStore,
        });
    } catch (error) {
        console.error("Error updating VectorStore:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteVectorStore = async (req, res) => {
    const { workspaceId, vectorStoreId } = req.params;
    const userId = req.user.id;

    try {
        const vectorStore = await VectorStore.findById(vectorStoreId);
        if (!vectorStore) {
            return res.status(404).json({ message: "VectorStore not found" });
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

        await VectorStore.findByIdAndDelete(vectorStoreId);

        workspace.vectorStores = workspace.vectorStores.filter(
            (id) => id.toString() !== vectorStoreId
        );
        await workspace.save();

        res.json({ message: "VectorStore deleted" });
    } catch (error) {
        console.error("Error deleting VectorStore:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.listVectorStores = async (req, res) => {
    const { workspaceId } = req.params;

    try {
        const workspace = await Workspace.findById(workspaceId).populate(
            "vectorStores"
        );
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const vectorStores = await VectorStore.find({
            _id: { $in: workspace.vectorStores },
        });

        res.json(vectorStores);
    } catch (error) {
        console.error("Error listing VectorStores:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getVectorStore = async (req, res) => {
    const { vectorStoreId } = req.params;

    try {
        const vectorStore = await VectorStore.findById(vectorStoreId);
        if (!vectorStore) {
            return res.status(404).json({ message: "VectorStore not found" });
        }

        res.json(vectorStore);
    } catch (error) {
        console.error("Error getting VectorStore:", error);
        res.status(500).json({ message: error.message });
    }
};
