const Folder = require("../models/folder.model");
const Workspace = require("../models/workspace.model");
const Alert = require("../models/alert.model");

exports.createFolder = async (req, res) => {
    const userId = req.user.id;
    const { name, description, visibility } = req.body;
    const { workspaceId } = req.params;
    try {
        const workspace = await Workspace.findOne({
            _id: workspaceId,
            "members.userId": userId,
        });
        if (!workspace) {
            return res.status(404).send({
                message:
                    "Workspace does not exist or you are not part of this workspace",
            });
        }

        const workspaceFolders = await Folder.findOneAndUpdate(
            { workspaceId: workspaceId },
            {
                $push: {
                    folders: {
                        name: name,
                        desc: description,
                        visibility: visibility,
                        creator: userId,
                    },
                },
            },
            { new: true, upsert: true }
        );

        const newFolder = workspaceFolders.folders.slice(-1)[0];

        await Workspace.findByIdAndUpdate(workspaceId, {
            $push: { folders: newFolder._id },
        });

        res.status(201).send({
            message: "Folder created successfully",
            folder: newFolder,
        });
    } catch (error) {
        console.error("Error in creating Folder: ", error);
        res.status(500).send({
            message: "Internal error occurred while creating the Folder.",
        });
    }
};

exports.getFolder = async (req, res) => {
    const { workspaceId, folderId } = req.params;
    try {
        const workspaceFolders = await Folder.findOne(
            { workspaceId },
            { folders: { $elemMatch: { _id: folderId } } }
        );
        if (!workspaceFolders || workspaceFolders.folders.length === 0) {
            return res.status(404).send({ message: "Folder not found." });
        }

        res.send(workspaceFolders.folders[0]);
    } catch (error) {
        console.error("Error in getting Folder: ", error);
        res.status(500).send({
            message: "Internal error occurred while getting the Folder.",
        });
    }
};

exports.updateFolder = async (req, res) => {
    const { workspaceId, folderId } = req.params;
    const updates = req.body;

    let updateOperations = {};
    for (let [key, value] of Object.entries(updates)) {
        updateOperations[`folders.$.${key}`] = value;
    }
    try {
        const result = await Folder.findOneAndUpdate(
            { workspaceId, "folders._id": folderId },
            { $set: updateOperations },
            { new: true }
        );

        if (!result) {
            return res
                .status(404)
                .send({ message: "Folder not found or update failed." });
        }

        res.send({
            message: "Folder updated successfully.",
            folder: result.folders.id(folderId),
        });
    } catch (error) {
        console.error("Error in updating Folder: ", error);
        res.status(500).send({
            message: "Internal error occurred while updating the Folder.",
        });
    }
};

// only the creator can delete a folder so I am omitting the confirm deletion here.

exports.deleteFolder = async (req, res) => {
    const userId = req.user.id;
    const { folderId, workspaceId } = req.params;

    try {
        const workspaceFolders = await Folder.findOne({ workspaceId });
        const folderToDelete = workspaceFolders.folders.id(folderId);

        if (!folderToDelete) {
            return res.status(404).send({ message: "Folder not found." });
        }

        if (folderToDelete.creator.toString() !== userId) {
            return res.status(403).send({
                message:
                    "You are not authorized to delete this folder, only the creator can.",
            });
        }

        const alertIds = folderToDelete.alerts;

        await Alert.deleteMany({
            _id: { $in: alertIds },
        });

        await Folder.findOneAndUpdate(
            { workspaceId },
            { $pull: { folders: { _id: folderId } } },
            { new: true }
        );

        res.send({
            message: "Folder and associated alerts deleted successfully.",
        });
    } catch (error) {
        console.error("Error in deleting Folder: ", error);
        res.status(500).send({
            message: "Internal error occurred while deleting the Folder.",
        });
    }
};

exports.listFolders = async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const workspaceFolders = await Folder.findOne({ workspaceId });
        if (!workspaceFolders) {
            return res.status(404).send({ message: "No folders found." });
        }

        if (
            !workspaceFolders.folders ||
            workspaceFolders.folders.length === 0
        ) {
            return res
                .status(200)
                .send({ message: "No folders found.", folders: [] });
        }

        res.json({
            message: "Folders retrieved successfully.",
            folders: workspaceFolders.folders,
        });
    } catch (error) {
        console.error("Error in listing Folders: ", error);
        res.status(500).send({
            message: "Internal error occurred while listing the Folders.",
        });
    }
};

exports.allAlerts = async (req, res) => {
    const { workspaceId, folderId } = req.params;
    try {
        const workspaceFolders = await Folder.findOne({ workspaceId });
        if (!workspaceFolders) {
            return res.status(404).send({ message: "No folders found." });
        }

        const folder = workspaceFolders.folders.id(folderId);
        if (!folder) {
            return res.status(404).send({ message: "Folder not found." });
        }
        const alerts = await Alert.find({
            _id: { $in: folder.alerts },
        });

        if (!alerts.length) {
            return res
                .status(404)
                .send({ message: "No alerts found in this folder." });
        }

        res.json(alerts);
    } catch (error) {
        console.error("Error in getting all alerts: ", error);
        res.status(500).send({
            message: "Internal error occurred while getting all alerts.",
        });
    }
};

// adding and deleting an alert to a folder is done by the alert controller
