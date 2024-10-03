const { sendToKafka } = require("../services/kafka.service");

exports.sendLogs = async (alertId, queryResult, queryStatus) => {
    await sendToKafka("logs", [{ alertId, queryResult, queryStatus }]);
    console.log("Logs sent successfully to Kafka");
};
