const { Pool } = require("pg");

async function performPGQuery(dbSettings) {
    try {
        const pool = new Pool({
            user: dbSettings.user,
            host: dbSettings.host,
            database: dbSettings.databaseName,
            password: dbSettings.password,
            port: dbSettings.port,
            ssl: dbSettings.ssl
                ? { rejectUnauthorized: !dbSettings.skipTlsVerify }
                : false,
            connectionTimeoutMillis: dbSettings.executionTimeout,
            max: dbSettings.connectionLimit || 10,
        });

        const { rows } = await pool.query(dbSettings.query);
        await pool.end();
        return { queryResult: rows, queryStatus: "success" };
    } catch (error) {
        console.error("Error performing PostgreSQL query:", error);
        throw error;
    }
}

module.exports = {
    performPGQuery,
};
