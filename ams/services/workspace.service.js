const Workspace = require('../models/workspace.model');

const updateDataRetention = async (workspaceId) => {
    const workspace = await Workspace.findById(workspaceId);
    const now = new Date();
    const dataRetention = new Date(now.getTime() + workspace.dataRetentionPeriod * 24 * 60 * 60 * 1000);
    workspace.dataRetention = dataRetention;
    await workspace.save();
};

module.exports = { updateDataRetention };