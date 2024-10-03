const { BigQuery } = require("@google-cloud/bigquery");

async function performBQQuery(dbSettings) {
    try {
        const bigquery = new BigQuery({
            projectId: dbSettings.projectId,
            credentials: {
                client_email: dbSettings.clientEmail,
                private_key: dbSettings.privateKey.replace(/\\n/g, "\n"),
            },
        });

        const [job] = await bigquery.createQueryJob({
            query: dbSettings.query,
            location: dbSettings.dataset,
        });

        console.log(`Job ${job.id} started.`);

        const [rows] = await job.getQueryResults();
        return { queryResult: rows, queryStatus: "success" };
    } catch (error) {
        console.error("Error performing BigQuery query:", error);
        throw error;
    }
}

module.exports = {
    performBQQuery,
};
