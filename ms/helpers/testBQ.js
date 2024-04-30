const { BigQuery } = require("@google-cloud/bigquery");

async function testBigQueryConnection(dataSourceDetails) {
    const bigQueryClient = new BigQuery({
        projectId: dataSourceDetails.projectId,
        credentials: {
            client_email: dataSourceDetails.clientEmail,
            private_key: dataSourceDetails.privateKey.replace(/\\n/g, "\n"),
        },
    });

    try {
        await bigQueryClient.getDatasets();
        return true;
    } catch (error) {
        console.error("BigQuery connection test failed:", error);
        return false;
    }
}


module.exports = testBigQueryConnection;