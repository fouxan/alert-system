const Workspace = require("../models/workspace.model");
const Alert = require("../models/alert.model");
const User = require("../models/user.model");
const { sendEmail } = require("./email.service");
const { deleteLogFiles, createLogFile } = require("./logfile.service");

async function checkDataRetention() {
    const now = new Date();
    const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const workspaces = await Workspace.find({
        $or: [
            { "dataRetention.endTime": { $lte: now } },
            { "dataRetention.endTime": { $lte: oneWeekAhead } },
        ],
    });

    for (const workspace of workspaces) {
        // get current workspaces workflows and alerts, and delete logs.
        if (workspace.dataRetention.endTime <= now) {
            workspace.wokflows.forEach((workflowId) => {
                deleteLogFiles(workflowId);
                createLogFile(workflowId);
            });
            const alerts = await Alert.find({ workspaceId: workspace._id });
            alerts.forEach((alert) => {
                deleteLogFiles(alert._id);
                createLogFile(alert._id);
            });
            // should we delete the docs as well?
            // workspace.documents.forEach((documentId) => {
            //     deleteDoc(documentId);
            // });
            workspace.dataRetention.endTime = new Date(
                Date.now() +
                    workspace.dataRetention.period * 24 * 60 * 60 * 1000
            );
            await workspace.save();
            console.log(
                `Workspace ${workspace._id} data retention policy enforced.`
            );
        } else if (
            workspace.dataRetention.endTime <= oneWeekAhead &&
            workspace.sendRetentionMail
        ) {
            const creator = workspace.members.find(
                (member) => member.role === "creator"
            );
            const creatorEmail = await User.findById(creator.userId)
                .select("email")
                .lean()
                .then((user) => user.email);
            sendEmail({
                email: creatorEmail,
                subject: "Data Retention Reminder",
                text: `Your data for workspace ${workspace.name} will be deleted in less than a week.`,
            });
            console.log(
                `Sent data retention reminder for workspace ${workspace._id}`
            );
        }
    }
}

module.exports = { checkDataRetention };
