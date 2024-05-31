const {performBQQuery} = require("../helpers/bigquery");
const {performElasticSearchQuery} = require("../helpers/elasticsearch");
const {performPGQuery} = require("../helpers/postgres");
const {performMySQLQuery} = require("../helpers/mysql");

const mapActionTypeToPartition = (actionType) => {
    switch (actionType) {
        case "email":
            return 0;
        case "slack":
            return 1;
        case "webex":
            return 2;
        case "webhook":
            return 3;
        default:
            return 0;
    }
};

const processMessage = async ({ message, producer, partition }) => {
    const { alertId, dbSettings, actionType } = JSON.parse(
        message.value.toString()
    );
    if(actionType === "updateNextCheckTime"){
        await producer.send({
            topic: "results",
            messages: [{ value: JSON.stringify({ alertId, result: {
                queryResults: "updateNextCheckTime",
                queryStatus: "paused",
            } }) }],
            AASPartition: mapActionTypeToPartition(actionType),
        });
        return;
    }
    console.log(`Processing message for Alert ID: ${alertId}`);
    const AASPartition = mapActionTypeToPartition(actionType);
    let result;

    try {

        switch (partition) {
            case 0:
                result = await performMySQLQuery(dbSettings);
                break;
            case 1:
                result = await performBQQuery(dbSettings);
                break;
            case 2:
                result = await performPGQuery(dbSettings);
                break;
            case 3:
                result = await performElasticSearchQuery(dbSettings);
            default:
                throw new Error("Unsupported database type");
        }

        console.log(`Query result:`, result);
        await producer.send({
            topic: "results",
            messages: [{ value: JSON.stringify({ alertId, result }) }],
            AASPartition,
        });
    } catch (error) {
        console.error(`Error in processing message: ${error.message}`);
        await producer.send({
            topic: "results",
            messages: [
                {
                    value: JSON.stringify({
                        alertId,
                        result: { queryStatus: "failed", queryResults: error },
                    }),
                },
            ],
            AASPartition,
        });
    }
};

module.exports = { processMessage };
