const { Client } = require('@elastic/elasticsearch');
const DataSource = require("../models/datasource.model");

async function performElasticSearchQuery(dbSettings) {
    try {
        const dataSource = await DataSource.findById(dbSettings.id);
        if (!dataSource) throw new Error("Data source not found");

        const client = new Client({
            node: `https://${dataSource.host}:${dataSource.port}`,
            auth: {
                username: dataSource.username,
                password: dataSource.password
            },
            ssl: {
                rejectUnauthorized: !dataSource.skipTlsVerify
            }
        });

        const { body } = await client.search({
            index: dataSource.indexName,
            body: {
                query: {
                    match: dbSettings.query
                }
            }
        });

        return { queryResult: body.hits.hits, queryStatus: "success" };
    } catch (error) {
        console.error("Error performing ElasticSearch query:", error);
        return { queryResult: error.message, queryStatus: "failed" };
    }
}

module.exports = {
    performElasticSearchQuery,
};
