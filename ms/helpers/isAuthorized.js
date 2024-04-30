
const mongoose = require("mongoose");
const Team = require("../models/team.model");
const Alert = require("../models/alert.model");

async function getUserTeamIds(userId) {
    const teams = await Team.find({ "members.userId": mongoose.Types.ObjectId(userId) });
    return teams.map(team => team._id.toString());
}

async function isAuthorized(alertId, userId, requiredPermission) {
    const alert = await Alert.findOne({"alerts._id": alertId}, "alerts.$ userId").populate({
        path: 'alerts.assignedUsers.userId',
        model: 'User'
    });

    if (!alert) {
        return false;
    }

    const alertDetails = alert.alerts[0];
    const isCreator = alert.userId.toString() === userId; // Check if the user is the creator

    const isDirectlyAssigned = alertDetails.assignedUsers.some(user =>
        user.userId._id.toString() === userId && user.permissions === requiredPermission
    );

    // Retrieve user's teams and check for permissions within those teams
    const userTeamIds = await getUserTeamIds(userId);
    const isTeamMemberWithPermission = alertDetails.assignedTeams.some(team =>
        userTeamIds.includes(team.teamId.toString()) && team.permissions === requiredPermission
    );

    const isSubscribed = alertDetails.subscribedUsers.some(subscription =>
        subscription.userId.toString() === userId && subscription.permissions === requiredPermission
    );

    return isCreator || isDirectlyAssigned || isTeamMemberWithPermission || isSubscribed;
}


module.exports = isAuthorized;


