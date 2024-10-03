const Alert = require("../models/alert.model");

async function isAuthorized(alertId, userId, requiredPermission) {
    const alert = await Alert.findById(alertId);

    if (!alert) {
        return false;
    }

    const isCreator = alert.creator.toString() === userId; // Check if the user is the creator

    const isDirectlyAssigned = alert.assignedUsers.some(
        (user) =>
            user.userId._id.toString() === userId &&
            user.permissions === requiredPermission
    );

    const isSubscribed = alert.subscribedUsers.some(
        (subscription) =>
            subscription.userId.toString() === userId &&
            subscription.permissions === requiredPermission
    );

    return (
        isCreator ||
        isDirectlyAssigned ||
        isSubscribed
    );
}

module.exports = isAuthorized;
