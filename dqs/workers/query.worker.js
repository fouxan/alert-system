const { performBQQuery } = require("../helpers/bigquery");
const { performElasticSearchQuery } = require("../helpers/elasticsearch");
const { performPGQuery } = require("../helpers/postgres");
const { performMySQLQuery } = require("../helpers/mysql");
const mapActionTypeToPartition = require("../helpers/getPartition");
const { sendToKafka } = require("../services/message.service");

module.exports = async ({ alertId, dbSettings, actionType, partition }) => {
    let result;
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
            break;
        default:
            throw new Error("Unsupported database type");
    }
    const AASPartition = mapActionTypeToPartition(actionType);
    await sendToKafka("results", [{ alertId, result }], AASPartition);
};
