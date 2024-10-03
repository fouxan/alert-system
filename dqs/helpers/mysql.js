const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const FILE_DIR = process.env.KEYFILE_DIR;

async function performMySQLQuery(dbSettings) {
  try {
    const connectionObject = {
      host: dbSettings.host,
      port: dbSettings.port,
      user: dbSettings.user,
      password: dbSettings.password,
      database: dbSettings.database,
    };
    if (dbSettings.ssl) {
      const caFilePath = path.join(FILE_DIR, dbSettings.caFilePath);
      const caContent = fs.readFileSync(caFilePath);
      connectionObject.ssl = {
        rejectUnauthorized: dbSettings.rejectUnauthorized,
        ca: caContent,
      };
    }
    const connection = await mysql.createConnection(connectionObject);

    const [results] = await connection.execute(dbSettings.query);
    await connection.end();
    return { queryResult: results, queryStatus: "success" };
  } catch (error) {
    console.log("Error performing MySQL query:", error);
    throw error;
  }
}

module.exports = {
  performMySQLQuery,
};
