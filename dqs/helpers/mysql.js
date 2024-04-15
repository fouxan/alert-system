const mysql = require("mysql2/promise");
const DataSource = require("../models/datasource.model");

async function performMySQLQuery(dbSettings) {
    try {
        const dataSource = await DataSource.findById(dbSettings.id);
        if (!dataSource) throw new Error("Data source not found");

        const connection = await mysql.createConnection({
            host: dataSource.host,
            user: dataSource.username,
            password: dataSource.password,
            database: dataSource.databaseName,
            ssl: dataSource.ssl
                ? { rejectUnauthorized: !dataSource.skipTlsVerify }
                : null,
            connectTimeout: dataSource.connectTimeout,
        });

        const [results] = await connection.execute(
            dbSettings.query,
            (err, rows, fields) => {
                if (err instanceof Error) {
                    console.log(err);
                    return {queryResult: err.message, queryStatus: "failed"};
                }
            }
        );
        await connection.end();
        return {queryResult: results, queryStatus: "success"};
    } catch (error) {
        console.log("Error performing MySQL query:", error);
        throw error;
    }
}

module.exports = {
    performMySQLQuery,
};
