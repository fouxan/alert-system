function isMaintenanceWindow(nextCheckTime, maintenanceWindow) {
    return nextCheckTime >= maintenanceWindow.start && nextCheckTime <= maintenanceWindow.end;
}

function isThrottle(nextCheckTime, triggerOptions) {
    if (!triggerOptions.throttle) return false;
    const throttleEndTime = new Date().getTime() + triggerOptions.triggerSuppressTime;
    return nextCheckTime <= throttleEndTime;
}
