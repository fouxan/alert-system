const { BigQuery } = require("@google-cloud/bigquery");
const DataSource = require("../models/datasource.model");

async function performBQQuery(dbSettings) {
    try {
        const dataSource = await DataSource.findById(dbSettings.dbId);
        if (!dataSource) throw new Error("Data source not found");

        const bigquery = new BigQuery({
            projectId: dataSource.projectId,
            credentials: {
                client_email: dataSource.clientEmail,
                private_key: dataSource.privateKey.replace(/\\n/g, "\n"),
            },
        });

        const [job] = await bigquery.createQueryJob({
            query: dbSettings.query,
            location: dataSource.dataset,
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
