const Piscina = require("piscina");
const path = require("path");
const { sendToKafka } = require("../services/message.service");

const piscina = new Piscina({
  filename: path.resolve(__dirname, "../workers/query.worker.js"),
});

const processMessage = async ({ message, partition }) => {
  const { alertId, dbSettings, actionType } = JSON.parse(
    message.value.toString(),
  );

  console.log(`Processing message for Alert ID: ${alertId}`);

  try {
    await piscina.run({ alertId, actionType, dbSettings, partition });
  } catch (error) {
    console.error(`Error in processing message: ${error.message}`);
    await sendToKafka("results", [
      {
        alertId,
        result: { queryStatus: "failed", queryResults: error.message },
      },
    ]);
  }
};

module.exports = { processMessage };
