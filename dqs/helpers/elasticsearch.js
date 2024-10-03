const { Client } = require('@elastic/elasticsearch');

async function performElasticSearchQuery(dbSettings) {
    try {
        const client = new Client({
            node: `https://${dbSettings.host}:${dbSettings.port}`,
            auth: {
                username: dbSettings.username,
                password: dbSettings.password
            },
            ssl: {
                rejectUnauthorized: !dbSettings.skipTlsVerify
            }
        });

        const { body } = await client.search({
            index: dbSettings.indexName,
            body: {
                query: {
                    match: dbSettings.query
                }
            }
        });

        return { queryResult: body.hits.hits, queryStatus: "success" };
    } catch (error) {
        console.error("Error performing ElasticSearch query:", error);
        throw error;
    }
}

module.exports = {
    performElasticSearchQuery,
};
