const { Pool } = require("pg");
const DataSource = require("../models/datasource.model");

async function performPGQuery(dbSettings) {
    try {
        const dataSource = await DataSource.findById(dbSettings.dbId);
        if (!dataSource) throw new Error("Data source not found");

        const pool = new Pool({
            user: dataSource.user,
            host: dataSource.host,
            database: dataSource.databaseName,
            password: dataSource.password,
            port: dataSource.port,
            ssl: dataSource.ssl
                ? { rejectUnauthorized: !dataSource.skipTlsVerify,}
                : false,
            connectionTimeoutMillis: dataSource.executionTimeout,
            max: dataSource.connectionLimit || 10,
        });

        const { rows } = await pool.query(dbSettings.query);
        await pool.end();
        return {queryResult: rows, queryStatus: "success"};
    } catch (error) {
        console.error("Error performing PostgreSQL query:", error);
        return { queryResult: error.message, queryStatus: "failed" };
    }
}

module.exports = {
    performPGQuery,
};
