const Workspace = require("../models/workspace.model");
const Alert = require("../models/alert.model");
const User = require("../models/user.model");
const fs = require("fs");
const path = require("path");
const { sendEmail } = require("./email.service");

const LOG_DIR = path.join(__dirname, "../logs"); // Directory for log files

async function checkDataRetention() {
    const now = new Date();
    const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // One week from now

    const workspaces = await Workspace.find({
        $or: [
            { dataRetention: { $lte: now } },
            { dataRetention: { $lte: oneWeekAhead } },
        ],
    });

    for (const workspace of workspaces) {
        if (workspace.dataRetention <= now) {
            deleteLogFiles(workspace._id.toString());
            console.log(
                `Workspace ${workspace._id} data retention policy enforced.`
            );
        } else if (
            workspace.dataRetention <= oneWeekAhead &&
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
                to: creatorEmail,
                subject: "Data Retention Reminder",
                text: `Your data for workspace ${workspace.name} will be deleted in less than a week.`,
            });
            console.log(
                `Sent data retention reminder for workspace ${workspace._id}`
            );
        }
    }
}

function deleteLogFiles(workspaceId) {
    const logFile = path.join(LOG_DIR, `${workspaceId}-logs.log`);
    const compressedLogFile = `${logFile}.gz`;

    [logFile, compressedLogFile].forEach((file) => {
        if (fs.existsSync(file)) {
            fs.unlink(file, (err) => {
                if (err) {
                    console.error(`Error deleting file ${file}:`, err);
                } else {
                    console.log(`Deleted log file: ${file}`);
                }
            });
        }
    });
}

module.exports = { checkDataRetention };
