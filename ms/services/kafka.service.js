const { producer } = require("../config/kafka.config");

const scheduleJob = async (alertId) => {
    try {
        await producer.connect();
        await producer.send({
            topic: "schedules",
            messages: [
                {
                    value: JSON.stringify({
                        alertId: alertId,
                        action: "schedule",
                    }),
                },
            ],
        });
        await producer.disconnect();
    } catch (error) {
        console.error("Failed to schedule job:", error);
    }
};

const unscheduleJob = async (alertId) => {
    try {
        await producer.connect();
        await producer.send({
            topic: "schedules",
            messages: [
                {
                    value: JSON.stringify({
                        alertId: alertId,
                        action: "unschedule",
                    }),
                },
            ],
        });
        await producer.disconnect();
    } catch (error) {
        console.error("Failed to unschedule job:", error);
    }
};

module.exports = {
    scheduleJob,
    unscheduleJob,
};
