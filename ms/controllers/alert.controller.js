const Alert = require("../models/alert.model");
const AlertVersion = require("../models/version.model");
const ActionResult = require("../models/actionResult.model");
const User = require("../models/user.model");
const Folder = require("../models/folder.model");
const ESSettings = require("../models/es.model");
const mongoose = require("mongoose");
const updateAlertData = require("../helpers/updateAlertData");
const isAuthorized = require("../helpers/isAuthorized");
const sendEmail = require("../services/email.service");
const { scheduleJob, unscheduleJob } = require("../services/kafka.service");
const { handleConfigSetup } = require("../services/configfile.service");

exports.createAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertData, folderId, workspaceId } = req.body;

    try {
        if (!folderId) {
            return res.status(400).json({ message: "Folder ID is required." });
        }
        const folder = await Folder.findOne(
            { "folders._id": folderId },
            "folders.$"
        ).exec();
        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        const alertId = new mongoose.Types.ObjectId();

        const newAlert = {
            _id: alertId,
            ...alertData,
            userId: userId,
            workspaceId: workspaceId,
            status: "created",
            creator: userId,
            folderId: folderId,
        };

        // Insert the new alert
        await Alert.create(newAlert);

        await Folder.findOneAndUpdate(
            { "folders._id": folderId },
            { $push: { "folders.$.alerts": alertId } },
            { new: true }
        );

        const version = new AlertVersion({
            alertId: alertId,
            versions: [
                {
                    versionName: `Initial Version`,
                    versionDesc: `Alert created`,
                    alertData: newAlert,
                },
            ],
        });

        await version.save();

        res.status(201).json({
            message: "Alert created successfully",
            alert: newAlert,
        });
    } catch (error) {
        console.error("Error in creating Alert: ", error);
        res.status(500).json({
            message: "Failed to create alert",
            error: error.message,
        });
    }
};

exports.getAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }

        if (alert.visibility === "private") {
            const isUserRelated =
                alert.creator.toString() === userId || // User is the creator
                alert.assignedUsers.some(
                    (u) => u.userId.toString() === userId
                ) || // User is assigned directly
                alert.subscribedUsers.some(
                    (u) => u.userId.toString() === userId
                ); // User is subscribed

            if (!isUserRelated) {
                return res
                    .status(403)
                    .json({ error: "You do not have access to this alert" });
            }
        }

        res.json(alert);
    } catch (error) {
        console.error("Error getting alert:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.listAlerts = async (req, res) => {
    const userId = req.user.id;

    try {
        const alerts = await Alert.aggregate([
            {
                $match: {
                    $or: [
                        { creator: mongoose.Types.ObjectId(userId) },
                        {
                            "assignedUsers.userId":
                                mongoose.Types.ObjectId(userId),
                        },
                        {
                            "subscribedUsers.userId":
                                mongoose.Types.ObjectId(userId),
                        },
                    ],
                },
            },
        ]);

        if (!alerts || alerts.length === 0) {
            return res
                .status(404)
                .json({ error: "No alerts found for the user" });
        }

        res.json(alerts);
    } catch (error) {
        console.error("Error getting user alerts:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;
    const updateData = req.body;

    try {
        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({ message: "Alert not found." });
        }

        // Check if the user has the necessary permissions to update the alert
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this alert." });
        }

        Object.assign(alert, updateData);
        alert.updatedAt = new Date();
        await alert.save();

        // Optionally, track changes in a version history
        await AlertVersion.findOneAndUpdate(
            { alertId: alertId },
            {
                $push: {
                    versions: {
                        versionName: `Update on ${new Date().toISOString()}`,
                        versionDesc: `Alert updated by ${userId}`,
                        alertData: alert.toObject(),
                    },
                },
            },
            { new: true, upsert: true }
        );

        res.json({
            message: "Alert updated successfully.",
            alert,
        });
    } catch (error) {
        console.error("Error updating alert: ", error);
        res.status(500).json({
            message: "Failed to update alert",
            error: error.message,
        });
    }
};

exports.deleteAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        const alert = await Alert.findById(alertId).populate(
            "creator",
            "email username"
        );

        if (!alert) {
            return res.status(404).json({ message: "Alert not found." });
        }

        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this alert" });
        }
        const requester = await User.findById(userId, "username");
        if (!requester) {
            return res.status(404).json({ message: "Requester not found." });
        }

        const OTP = Math.floor(1000 + Math.random() * 9000);
        alert.deleteKey = OTP;
        await alert.save();

        await sendEmail({
            to: alert.creator.email,
            subject: `Confirm Alert Deletion || ${alert.alertName}`,
            templateName: "confirm-deletion",
            variables: {
                delete_type: "alert",
                entity_name: alert.alertName,
                requested_by: requester.username,
                otp: OTP,
            },
        });

        res.status(200).json({
            message: "Confirmation email sent to alert owner.",
        });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.confirmAlertDeletion = async (req, res) => {
    const { alertId } = req.params;
    const { otp } = req.body;
    const userId = req.user.id;
    try {
        const alert = await Alert.findOne({
            _id: alertId,
            deleteKey: otp,
            creator: userId,
        });

        if (!alert) {
            return res
                .status(404)
                .json({ message: "Alert not found or OTP does not match." });
        }

        if (alert.status === "running") {
            await unscheduleJob(alertId);
        }

        await Alert.deleteOne({ _id: alertId });

        res.json({ message: "Alert successfully deleted." });
    } catch (error) {
        console.error("Error confirming deletion:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.pauseAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to pause this alert." });
        }

        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        if (alert.status === "paused") {
            return res.status(400).json({ error: "Alert is already paused" });
        }

        const updateResult = await Alert.updateOne(
            { _id: alertId },
            { $set: { status: "paused" } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        await unscheduleJob(alertId);

        res.json({ message: "Alert paused successfully" });
    } catch (error) {
        console.error("Error pausing alert:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.runAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to run this alert." });
        }
        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }
        if (alert.status === "running") {
            return res.status(400).json({ error: "Alert is already running" });
        }

        const updateResult = await Alert.updateOne(
            { _id: alertId },
            { $set: { status: "running" } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        // const esSettings = await ESSettings.findById(alert.esSettingsId);
        // if (!esSettings) {
        //   return res.status(404).json({ error: "ES Settings not found" });
        // }
        // const configFileContent = alert.configFileContent;
        // const variables = {
        //   alertId: alertId,
        //   configFileContent,
        // };
        const actionResult = new ActionResult({
            alert_id: alertId,
            results: [],
        });
        await actionResult.save();

        await scheduleJob(alertId);
        // await handleConfigSetup(null, alertId, variables, "create");

        res.json({ message: "Alert run successfully" });
    } catch (error) {
        console.error("Error running alert:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.assignUser = async (req, res) => {
    const { alertId } = req.params;
    const { newUser, role } = req.body;
    const userId = req.user.id;
    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res.status(403).json({
                message: "Not authorized to assign users to this alert.",
            });
        }

        const alert = await Alert.findOneAndUpdate(
            { _id: alertId },
            {
                $push: {
                    assignedUsers: { userId: newUser, permissions: role },
                },
            },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        res.json({ message: "User assigned successfully", alert });
    } catch (error) {
        console.error("Error in assigning user: ", error);
        res.status(500).json({ error: error.message });
    }
};

exports.unassignUser = async (req, res) => {
    const { alertId } = req.params;
    const { userIdToRemove } = req.body;
    const userId = req.user.id;
    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res.status(403).json({
                message: "Not authorized to unassign users to this alert",
            });
        }
        const alert = await Alert.findOneAndUpdate(
            { _id: alertId },
            { $pull: { assignedUsers: { userId: userIdToRemove } } },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        res.json({ message: "User unassigned successfully", alert });
    } catch (error) {
        console.error("Error in un-assigning user: ", error);
        res.status(500).json({ error: error.message });
    }
};

exports.subscribeToAlert = async (req, res) => {
    const { alertId } = req.params;
    const userId = req.user.id;
    const { permissions, alertStatus, triggerTimeframe, contactMethods } =
        req.body;
    try {
        const alert = await Alert.findOneAndUpdate(
            { _id: alertId },
            {
                $push: {
                    subscribedUsers: {
                        userId,
                        permissions,
                        alertStatus,
                        triggerTimeframe,
                        contactMethods,
                    },
                },
            },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        res.json({ message: "User subscribed successfully", alert });
    } catch (error) {
        console.error("Error in subscribing: ", error);
        res.status(500).json({ error: error.message });
    }
};

exports.unsubscribeFromAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        const alert = await Alert.findOneAndUpdate(
            { _id: alertId },
            { $pull: { subscribedUsers: { userId } } },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        res.json({ message: "User unsubbed successfully", alert });
    } catch (error) {
        console.error("Error in un-subscribing: ", error);
        res.status(500).json({ error: error.message });
    }
};

exports.pauseExecution = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res.status(403).json({
                message: "Not authorized to pause this alert's execution.",
            });
        }

        const updateResult = await Alert.updateOne(
            { _id: alertId },
            { $set: { queryExecStatus: "paused" } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        res.json({ message: "Alert execution paused successfully" });
    } catch (error) {
        console.error("Error pausing alert execution:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAlertResults = async (req, res) => {
    const { alertId } = req.params;
    const userId = req.user.id;

    if (!(await isAuthorized(alertId, userId, "viewer"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized access to alert results." });
    }

    try {
        const results = await ActionResult.find({ alert_id: alertId });
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching alert results:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAlertResult = async (req, res) => {
    const { alertId, resultId } = req.params;
    const userId = req.user.id;

    if (!(await isAuthorized(alertId, userId, "viewer"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized access to alert result." });
    }

    try {
        const result = await ActionResult.findOne(
            { alert_id: alertId, "results._id": resultId },
            { "results.$": 1 } // Return only the matched result
        );
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching alert result:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.addNote = async (req, res) => {
    const { alertId, resultId } = req.params;
    const { note } = req.body;
    const userId = req.user.id;

    if (!(await isAuthorized(alertId, userId, "editor"))) {
        return res.status(403).json({ message: "Unauthorized to add note." });
    }

    try {
        const actionResult = await ActionResult.findOneAndUpdate(
            { alert_id: alertId, "results._id": resultId },
            {
                $push: {
                    "results.$.actions.actionNotes": { note, noteBy: userId },
                },
            },
            { new: true }
        );
        res.status(201).json({
            message: "Note added successfully.",
            notes: actionResult.results.id(resultId).actions.actionNotes,
        });
    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNotes = async (req, res) => {
    const { alertId, resultId } = req.params;
    const userId = req.user.id;

    if (!(await isAuthorized(alertId, userId, "viewer"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized access to notes." });
    }

    try {
        const actionResult = await ActionResult.findOne(
            { alert_id: alertId, "results._id": resultId },
            { "results.$": 1 } // Return only the matched result
        );

        if (!actionResult) {
            return res.status(404).json({ message: "Result not found." });
        }

        res.status(200).json(actionResult.results[0].actions.actionNotes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNote = async (req, res) => {
    const { alertId, resultId, noteId } = req.params;
    const userId = req.user.id;

    if (!(await isAuthorized(alertId, userId, "viewer"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized access to note." });
    }

    try {
        const actionResult = await ActionResult.findOne(
            { alert_id: alertId, "results._id": resultId },
            { "results.$": 1 } // Return only the matched result
        );

        if (!actionResult) {
            return res.status(404).json({ message: "Result not found." });
        }

        const note = actionResult.results[0].actions.actionNotes.id(noteId);

        if (!note) {
            return res.status(404).json({ message: "Note not found." });
        }

        res.status(200).json(note);
    } catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateNote = async (req, res) => {
    const { alertId, resultId, noteId } = req.params;
    const userId = req.user.id;
    const { note } = req.body;

    if (!(await isAuthorized(alertId, userId, "editor"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized to update note." });
    }

    try {
        const actionResult = await ActionResult.findOneAndUpdate(
            {
                alert_id: alertId,
                "results._id": resultId,
                "results.actions.actionNotes._id": noteId,
            },
            { $set: { "results.$.actions.actionNotes.$.note": note } },
            { new: true }
        );

        if (!actionResult) {
            return res.status(404).json({ message: "Note not found." });
        }

        const updatedNote = actionResult.results
            .id(resultId)
            .actions.actionNotes.id(noteId);

        res.status(200).json({
            message: "Note updated successfully.",
            note: updatedNote,
        });
    } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    const { alertId, resultId, noteId } = req.params;
    const userId = req.user.id;

    if (!(await isAuthorized(alertId, userId, "editor"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized to delete note." });
    }

    try {
        const actionResult = await ActionResult.findOneAndUpdate(
            { alert_id: alertId, "results._id": resultId },
            { $pull: { "results.$.actions.actionNotes": { _id: noteId } } },
            { new: true }
        );

        if (!actionResult) {
            return res
                .status(404)
                .json({ message: "Note not found or could not be deleted." });
        }

        res.status(200).json({ message: "Note deleted successfully." });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.takeActionOnResult = async (req, res) => {
    const { alertId, resultId } = req.params;
    const userId = req.user.id;
    const { action, notes } = req.body;

    if (!(await isAuthorized(alertId, userId, "editor"))) {
        return res
            .status(403)
            .json({ message: "Unauthorized to take action." });
    }

    try {
        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        const result = actionResult.results.id(resultId);
        if (!result) {
            return res.status(404).json({ message: "Result not found." });
        }

        result.actions.actionTaken = action;
        result.actions.status =
            action === "re-escalated" ? "pending" : "completed";
        result.actions.actionBy = userId;

        if (notes) {
            result.actions.actionNotes.push({ note: notes, noteBy: userId });
        }

        await actionResult.save();
        res.status(200).json({ message: "Action taken successfully.", result });
    } catch (error) {
        console.error("Error taking action on result:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStats = async (req, res) => {
    const { alertId } = req.params;
    try {
        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const result = await ActionResult.findOne({ alert_id: alertId });
        if (!result) {
            return res
                .status(404)
                .json({ message: "No results found for the alert" });
        }

        const stats = {
            totalResults: result.results.length,
            pendingResults: result.results.filter(
                (r) => r.actions.status === "pending"
            ).length,
            completedResults: result.results.filter(
                (r) => r.actions.status === "completed"
            ).length,
            acknowledgedResults: result.results.filter(
                (r) => r.actions.actionTaken === "acknowledged"
            ).length,
            snoozedResults: result.results.filter(
                (r) => r.actions.actionTaken === "snoozed"
            ).length,
            closedResults: result.results.filter(
                (r) => r.actions.actionTaken === "closed"
            ).length,
            reEscalatedResults: result.results.filter(
                (r) => r.actions.actionTaken === "re-escalated"
            ).length,
            status: alert.status,
            lastCheckTime: alert.lastCheckTime,
            runningStatus: alert.runningStatus,
        };

        res.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getVersions = async (req, res) => {
    const { alertId } = req.params;

    try {
        const versions = await AlertVersion.findOne({ alertId });

        if (!versions) {
            return res
                .status(404)
                .json({ message: "No versions found for this alert." });
        }

        res.json({ versions: versions.versions });
    } catch (error) {
        console.error("Error fetching alert versions:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.rollbackVersion = async (req, res) => {
    const { alertId, versionId } = req.params;

    try {
        const alertVersionDoc = await AlertVersion.findOne({ alertId });

        if (!alertVersionDoc) {
            return res
                .status(404)
                .json({ message: "Alert versions not found." });
        }

        const versionToRollback = alertVersionDoc.versions.id(versionId);

        if (!versionToRollback) {
            return res
                .status(404)
                .json({ message: "Specified version not found." });
        }

        await updateAlertData(alertId, versionToRollback.alertData);

        res.json({
            message: "Alert successfully rolled back to the specified version.",
        });
    } catch (error) {
        console.error("Error rolling back to version:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteVersion = async (req, res) => {
    const { alertId, versionId } = req.params;

    try {
        await AlertVersion.updateOne(
            { alertId },
            { $pull: { versions: { _id: versionId } } }
        );

        res.json({ message: "Version successfully deleted." });
    } catch (error) {
        console.error("Error deleting version:", error);
        res.status(500).json({ error: error.message });
    }
};
