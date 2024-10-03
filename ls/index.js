const { initKafka } = require("./services/kafka.service");
const { writeLog } = require("./services/logfile.service");

const consumer = initKafka();

console.log("Running LS...");
async () => {
    await consumer.run({
        eachMessage: async ({ message }) => {
                const { alertId, queryResult, queryStatus } = JSON.parse(
                    message.value.toString()
                );
                writeLog(alertId, queryResult, queryStatus);
        },
    });
};
