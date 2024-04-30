const mysql = require("mysql2/promise");

async function testMySQLConnection(dataSourceDetails) {
    try {
        const connection = await mysql.createConnection({
            host: dataSourceDetails.host,
            user: dataSourceDetails.user,
            password: dataSourceDetails.password,
            database: dataSourceDetails.databaseName,
            port: dataSourceDetails.port,
            ssl: dataSourceDetails.ssl
                ? {
                      rejectUnauthorized:
                          dataSourceDetails.skipTlsVerify !== true,
                  }
                : null,
        });
        await connection.query("SELECT 1");
        await connection.end();
        return true;
    } catch (error) {
        console.error("MySQL connection test failed:", error);
        return false;
    }
}

module.exports = testMySQLConnection;
