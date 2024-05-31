const Workspace = require("../models/workspace.model");
const User = require("../models/user.model");
const { sendEmail } = require("./email.service");
const { updateDataRetention } = require("./workspace.service");
const { deleteLogFiles } = require("./file.service");


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
            await updateDataRetention(workspace._id);
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
