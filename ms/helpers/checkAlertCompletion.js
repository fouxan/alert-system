function isAlertComplete(alert) {
    let isDbSettingsComplete =
        alert.dbSettings && alert.dbSettings.dbId && alert.dbSettings.query;

        let isScheduleComplete =
        alert.schedule &&
        (alert.schedule.frequency || alert.schedule.realtimes);

    if (alert.alertType === "realtime") {
        isScheduleComplete = isScheduleComplete && alert.schedule.realtimes;
    } else if (alert.alertType === "scheduled") {
        isScheduleComplete = isScheduleComplete && alert.schedule.frequency;
    }

    // Check conditions completeness
    let isConditionComplete =
        alert.condition &&
        alert.condition.trigger &&
        alert.condition.triggerThreshold !== undefined &&
        alert.condition.triggerSchedule &&
        alert.condition.alertLevels &&
        alert.condition.alertLevels.length > 0 &&
        alert.condition.alertLevels[0].low !== undefined &&
        alert.condition.alertLevels[0].medium !== undefined &&
        alert.condition.alertLevels[0].high !== undefined &&
        alert.condition.triggerOptions;


    // Check actions completeness
    let isActionComplete = false;
    if (alert.action) {
        const { actionType, actionSettings } = alert.action;
        if (
            alert.action.actionType &&
            alert.action.actionSettings &&
            alert.action.actionSettings[actionType]
        ) {
            const settings = actionSettings[actionType];
            switch (actionType) {
                case "email":
                    isActionComplete =
                        settings.to && settings.subject && settings.body;
                    break;
                case "slack":
                    isActionComplete = settings.channel && settings.message;
                    break;
                case "webex":
                    isActionComplete = settings.roomId && settings.message;
                    break;
                case "webhook":
                    isActionComplete = settings.url;
                    break;
                default:
                    break;
            }
        }
    }


    let isMetadataComplete = alert.alertName;

    return (
        isMetadataComplete &&
        isDbSettingsComplete &&
        isScheduleComplete &&
        isConditionComplete &&
        isActionComplete
    );
}

module.exports = isAlertComplete;
