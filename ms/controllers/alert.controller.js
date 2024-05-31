const Alert = require("../models/alert.model");
const AlertVersion = require("../models/version.model");
const User = require("../models/user.model");
const isAlertComplete = require("../helpers/checkAlertCompletion");
const Folder = require("../models/folder.model");
const mongoose = require("mongoose");
const updateAlertData = require("../helpers/updateAlertData");
const isAuthorized = require("../helpers/isAuthorized");
const sendMail = require("../services/email.service");

// TODO: Implement logs here.

exports.createAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertData, folderId } = req.body;

    try {
        if (!folderId) {
            return res.status(400).json({ message: "Folder ID is required." });
        }
        const folder = await Folder.findOne(
            { "folders._id": folderId, userId: userId },
            "folders.$"
        ).exec();
        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }
        const workspaceId = folder.folders[0].workspaceId;

        const alertId = new mongoose.Types.ObjectId();
        const isComplete = isAlertComplete(alertData);
        console.log(isComplete);

        const newAlert = {
            _id: alertId,
            ...alertData,
            workspaceId: workspaceId,
            status: isComplete ? "running" : "incomplete",
            userId: userId,
            folderId: folderId,
            nextCheckTime: isComplete ? new Date() : undefined, // Set the nextCheckTime accordingly
        };

        // Insert the new alert
        const updatedAlerts = await Alert.findOneAndUpdate(
            { userId },
            { $push: { alerts: newAlert } },
            { new: true, upsert: true } // Upsert to create a new document if one doesn't exist
        );

        await Folder.findOneAndUpdate(
            { userId, "folders._id": folderId },
            { $push: { "folders.$.alerts": alertId } },
            { new: true }
        );

        const version = new AlertVersion({
            alertId: alertId, // The ID of the newly created alert
            versions: [
                {
                    versionName: `Initial Version`,
                    versionDesc: `Alert created`,
                    alertData: newAlert, // Include the alert data here
                },
            ],
        });

        await version.save();

        res.status(201).json({
            message: "Alert created successfully",
            alert: updatedAlerts.alerts.find((a) => a._id.equals(alertId)),
        });
    } catch (error) {
        console.error("Error in creating Alert: ", error);
        res.status(500).json({
            message: "Failed to create alert",
            error: error.message,
        });
    }
};

exports.updateAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;
    const updateData = req.body;

    try {
        const alert = await Alert.findOne({ "alerts._id": alertId });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found." });
        }

        const alertToUpdate = alert.alerts.id(alertId);

        if (!alertToUpdate) {
            return res.status(404).json({ message: "Alert not found." });
        }

        // Check if the user has the necessary permissions to update the alert
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this alert." });
        }

        // Apply the updates to the alert
        Object.keys(updateData).forEach((key) => {
            alertToUpdate[key] = updateData[key];
        });

        const completeStatus = isAlertComplete(alertToUpdate); // Ensure this function is correctly implemented to determine the status
        alertToUpdate.status = completeStatus ? "running" : "incomplete";

        await alert.save(); // Save the parent document to persist nested changes

        // Optionally, track changes in a version history
        await AlertVersion.findOneAndUpdate(
            { alertId: alertId },
            {
                $push: {
                    versions: {
                        versionName: `Update on ${new Date().toISOString()}`,
                        versionDesc: `Alert updated by ${userId}`,
                        alertData: alertToUpdate.toObject(), // Convert the Mongoose subdocument to a plain object
                    },
                },
            },
            { new: true, upsert: true }
        );

        res.json({
            message: "Alert updated successfully.",
            alert: alertToUpdate,
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
        const alert = await Alert.findOne(
            { "alerts._id": alertId },
            "userId"
        ).populate("userId", "email username");

        if (!alert) {
            return res.status(404).json({ message: "Alert not found." });
        }

        const alertToDelete = alert.alerts.id(alertId);
        if (!alertToDelete) {
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

        await sendMail({
            to: alert.userId.email,
            subject: "Confirm Alert Deletion",
            templateName: "confirm-deletion",
            variables: {
                deleteType: "alert",
                entityName: alertToDelete.alertName,
                requestBy: requester.username,
                otp: OTP,
            },
        });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.confirmDeletion = async (req, res) => {
    const { alertId, otp } = req.params;
    const userId = req.user.id;
    try {
        const alert = await Alert.findOne({
            "alerts._id": alertId,
            "alerts.deleteKey": otp,
            userId: userId,
        });

        if (!alert) {
            return res
                .status(404)
                .json({ message: "Alert not found or OTP does not match." });
        }

        const alertToDelete = alert.alerts.id(alertId);

        if (!alertToDelete) {
            return res.status(404).json({ message: "Alert not found." });
        }

        if (alertToDelete.deleteKey === otp) {
            await Alert.updateOne(
                { _id: alert._id },
                { $pull: { alerts: { _id: alertId } } }
            );
            res.json({ message: "Alert successfully deleted." });
        } else {
            return res
                .status(403)
                .json({
                    message: "Invalid OTP provided, cannot delete alert.",
                });
        }
    } catch (error) {}
};

// not implementing versions for users, teams and pausing alerts
// as we have dedicated endpoints for undoing these actions

exports.pauseAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to pause this alert." });
        }

        const updateResult = await Alert.updateOne(
            { "alerts._id": alertId },
            { $set: { "alerts.$.status": "paused" } }
        );

        console.log(updateResult);
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

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

        const updateResult = await Alert.updateOne(
            { "alerts._id": alertId },
            { $set: { "alerts.$.status": "running" } }
        );

        console.log(updateResult);
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        res.json({ message: "Alert run successfully" });
    } catch (error) {
        console.error("Error running alert:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        const alert = await Alert.findOne(
            { "alerts._id": alertId },
            { "alerts.$": 1 }
        ).populate("alerts.assignedTeams.teamId");

        if (!alert || alert.alerts.length === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        const foundAlert = alert.alerts[0];

        if (foundAlert.visibility === "private") {
            const isUserRelated =
                foundAlert.userId.toString() === userId || // User is the creator
                foundAlert.assignedUsers.some(
                    (u) => u.userId.toString() === userId
                ) || // User is assigned directly
                foundAlert.subscribedUsers.some(
                    (u) => u.userId.toString() === userId
                ) || // User is subscribed
                foundAlert.assignedTeams.some((team) =>
                    team.teamId.members.includes(userId)
                ); // User is in an assigned team

            if (!isUserRelated) {
                return res
                    .status(403)
                    .json({ error: "You do not have access to this alert" });
            }
        }

        res.json(foundAlert);
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
                        { userId: mongoose.Types.ObjectId(userId) },
                        {
                            "assignedUsers.userId":
                                mongoose.Types.ObjectId(userId),
                        },
                        {
                            "assignedTeams.teamId": {
                                $in: await getUserTeamIds(userId),
                            },
                        },
                        {
                            "subscribedUsers.userId":
                                mongoose.Types.ObjectId(userId),
                        },
                    ],
                },
            },
            {
                $unwind: "$alerts",
            },
            {
                $match: {
                    $or: [
                        { "alerts.userId": mongoose.Types.ObjectId(userId) },
                        {
                            "alerts.assignedUsers.userId":
                                mongoose.Types.ObjectId(userId),
                        },
                        {
                            "alerts.assignedTeams.teamId": {
                                $in: await getUserTeamIds(userId),
                            },
                        },
                        {
                            "alerts.subscribedUsers.userId":
                                mongoose.Types.ObjectId(userId),
                        },
                    ],
                },
            },
            {
                $group: {
                    _id: "$_id",
                    alerts: { $push: "$alerts" },
                },
            },
        ]);

        if (!alerts || alerts.length === 0) {
            return res
                .status(404)
                .json({ error: "No alerts found for the user" });
        }

        res.json(alerts.map((alert) => alert.alerts).flat());
    } catch (error) {
        console.error("Error getting user alerts:", error);
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
            { "alerts._id": alertId },
            {
                $push: {
                    "alerts.$.assignedUsers": {
                        userId: newUser,
                        permissions: role,
                    },
                },
            },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        const updatedAlert = alert.alerts.find(
            (a) => a._id.toString() === alertId
        );

        if (!updatedAlert) {
            return res.status(404).json({ message: "Updated alert not found" });
        }

        res.json({
            message: "User assigned successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Error in assigning user: ", error);
        res.status(500).json({
            error: error.message,
        });
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
            { "alerts._id": alertId },
            { $pull: { "alerts.$.assignedUsers": { userId: userIdToRemove } } },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        const updatedAlert = alert.alerts.find(
            (a) => a._id.toString() === alertId
        );

        if (!updatedAlert) {
            return res.status(404).json({ message: "Updated alert not found" });
        }
        res.json({
            message: "User unassigned successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Error in un-assigning user: ", error);
        res.status(500).json({
            error: error.message,
        });
    }
};

exports.assignTeam = async (req, res) => {
    const { alertId } = req.params;
    const { teamId } = req.body;
    const userId = req.user.id;
    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res.status(403).json({
                message: "Not authorized to assign teams to this alert.",
            });
        }

        const alert = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            {
                $push: {
                    "alerts.$.assignedTeams": { teamId: teamId },
                },
            },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        const updatedAlert = alert.alerts.find(
            (a) => a._id.toString() === alertId
        );

        if (!updatedAlert) {
            return res.status(404).json({ message: "Updated alert not found" });
        }

        res.json({
            message: "Team assigned successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Error in assigning team: ", error);
        res.status(500).json({
            error: error.message,
        });
    }
};

exports.unassignTeam = async (req, res) => {
    const { alertId } = req.params;
    const { teamId } = req.body;
    const userId = req.user.id;
    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res.status(403).json({
                message: "Not authorized to unassign teams to this alert.",
            });
        }
        const alert = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            {
                $pull: {
                    "alerts.$.assignedTeams": { teamId: teamId },
                },
            },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        const updatedAlert = alert.alerts.find(
            (a) => a._id.toString() === alertId
        );

        if (!updatedAlert) {
            return res.status(404).json({ message: "Updated alert not found" });
        }

        res.json({
            message: "Team unassigned successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Error in un-assigning team: ", error);
        res.status(500).json({
            error: error.message,
        });
    }
};

exports.subscribeToAlert = async (req, res) => {
    const { alertId } = req.params;
    const userId = req.user.id;
    const { permissions, alertStatus, triggerTimeframe } = req.body;
    try {
        const alert = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            {
                $push: {
                    "alerts.$.subscribedUsers": {
                        userId,
                        permissions,
                        alertStatus,
                        triggerTimeframe,
                    },
                },
            },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        const updatedAlert = alert.alerts.find(
            (a) => a._id.toString() === alertId
        );

        if (!updatedAlert) {
            return res.status(404).json({ message: "Updated alert not found" });
        }

        res.json({
            message: "User subscribed successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Error in subscribing: ", error);
        res.status(500).json({
            error: error.message,
        });
    }
};

exports.unsubscribeFromAlert = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        const alert = await Alert.findOneAndUpdate(
            { "alerts._id": alertId },
            { $pull: { "alerts.$.subscribedUsers": { userId } } },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }
        const updatedAlert = alert.alerts.find(
            (a) => a._id.toString() === alertId
        );

        if (!updatedAlert) {
            return res.status(404).json({ message: "Updated alert not found" });
        }

        res.json({
            message: "User unsubbed successfully",
            alert: updatedAlert,
        });
    } catch (error) {
        console.error("Error in un-subscribing: ", error);
        res.status(500).json({
            error: error.message,
        });
    }
};

// ------------------------------------------------------------------------------------------------------------
// Result functions.

// TODO: Test these and alert action results
exports.getAlertResults = async (req, res) => {
    const { alertId } = req.params;
    const userId = req.user.id;

    if (!await isAuthorized(alertId, userId, "viewer")) {
        return res.status(403).json({ message: 'Unauthorized access to alert results.' });
    }

    try {
        const results = await ActionResult.find({ alert_id: alertId });
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching alert results:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAlertResult = async (req, res) => {
    const { alertId, resultId } = req.params;
    const userId = req.user.id;

    if (!await isAuthorized(alertId, userId, "viewer")) {
        return res.status(403).json({ message: 'Unauthorized access to alert result.' });
    }

    try {
        const result = await ActionResult.findOne({ alert_id: alertId, 'results._id': resultId });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching alert result:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.addNote = async (req, res) => {
    const { alertId, resultId } = req.params;
    const { note } = req.body;
    const userId = req.user.id;

    if (!await isAuthorized(alertId, userId, "editor")) {
        return res.status(403).json({ message: 'Unauthorized to add note.' });
    }

    try {
        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        const result = actionResult.results.id(resultId);
        if (!result) {
            return res.status(404).json({ message: 'Result not found.' });
        }

        result.actionNotes.push({
            note: note,
            noteBy: req.user._id
        });

        await actionResult.save();
        res.status(201).json({ message: 'Note added successfully.', result: result });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNotes = async (req, res) => {
    const { alertId, resultId } = req.params;
    const userId = req.user.id;

    if (!await isAuthorized(alertId, userId, "viewer")) {
        return res.status(403).json({ message: 'Unauthorized access to notes.' });
    }

    try {
        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        const result = actionResult.results.id(resultId);
        if (!result) {
            return res.status(404).json({ message: 'Result not found.' });
        }

        res.status(200).json(result.actionNotes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNote = async (req, res) => {
    const { alertId, resultId, noteId } = req.params;
    const userId = req.user.id;

    if (!await isAuthorized(alertId, userId, "viewer")) {
        return res.status(403).json({ message: 'Unauthorized access to note.' });
    }

    try {
        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        const result = actionResult.results.id(resultId);
        const note = result.actionNotes.id(noteId);

        if (!note) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateNote = async (req, res) => {
    const { alertId, resultId, noteId } = req.params;
    const userId = req.user.id;
    const { note } = req.body;

    if (!await isAuthorized(alertId, userId, "editor")) {
        return res.status(403).json({ message: 'Unauthorized to update note.' });
    }

    try {
        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        const result = actionResult.results.id(resultId);
        const noteToUpdate = result.actionNotes.id(noteId);

        if (!noteToUpdate) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        noteToUpdate.note = note;
        await actionResult.save();

        res.status(200).json({ message: 'Note updated successfully.', note: noteToUpdate });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    const { alertId, resultId, noteId } = req.params;
    const userId = req.user.id;

    if (!await isAuthorized(alertId, userId, "editor")) {
        return res.status(403).json({ message: 'Unauthorized to delete note.' });
    }

    try {
        const actionResult = await ActionResult.updateOne(
            { alert_id: alertId, 'results._id': resultId },
            { $pull: { 'results.$.actionNotes': { _id: noteId } } }
        );

        if (actionResult.modifiedCount === 0) {
            return res.status(404).json({ message: 'Note not found or could not be deleted.' });
        }

        res.status(200).json({ message: 'Note deleted successfully.' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.takeActionOnResult = async (req, res) => {
    const { alertId, resultId } = req.params;
    const userId = req.user.id;
    const { action, notes } = req.body;

    if (!await isAuthorized(alertId, userId, "editor")) {
        return res.status(403).json({ message: 'Unauthorized to take action.' });
    }

    try {
        const actionResult = await ActionResult.findOne({ alert_id: alertId });
        const result = actionResult.results.id(resultId);
        if (!result) {
            return res.status(404).json({ message: 'Result not found.' });
        }

        result.actionTaken = action;
        result.status = action === 're-escalated' ? 'pending' : 'completed';
        result.actionBy = userId;

        if (notes) {
            result.actionNotes.push({
                note: notes,
                noteBy: userId
            });
        }

        await actionResult.save();
        res.status(200).json({ message: 'Action taken successfully.', result: result });
    } catch (error) {
        console.error('Error taking action on result:', error);
        res.status(500).json({ error: error.message });
    }
};

// TODO: Test these and version history
exports.pauseExecution = async (req, res) => {
    const userId = req.user.id;
    const { alertId } = req.params;

    try {
        if (!(await isAuthorized(alertId, userId, "editor"))) {
            return res
                .status(403)
                .json({ message: "Not authorized to pause this alert's execution." });
        }

        const updateResult = await Alert.updateOne(
            { "alerts._id": alertId },
            { $set: { "alerts.$.queryExecStatus": "paused" } }
        );

        console.log(updateResult);
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        res.json({ message: "Alert execution paused successfully" });
    } catch (error) {
        console.error("Error pausing alert execution:", error);
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
        console.error("Error fetching alert versions: ", error);
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
        console.error("Error rolling back to version: ", error);
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
        console.error("Error deleting version: ", error);
        res.status(500).json({ error: error.message });
    }
};
