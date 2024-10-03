const { BigQuery } = require("@google-cloud/bigquery");
const mysql = require("mysql2/promise");
const { Client: PGClient } = require("pg");
const { Client: ESClient } = require("@elastic/elasticsearch");
const path = require("path");
const fs = require("fs");
const FILE_DIR = process.env.KEYFILE_DIR;

async function testElasticSearchConnection(dataSourceDetails) {
  let connectionObject;
  switch (dataSourceDetails.authType) {
    case "no-auth":
      connectionObject = {
        node: dataSourceDetails.node,
      };
      break;
    case "bearer":
      connectionObject = {
        node: dataSourceDetails.node,
        auth: {
          bearer: dataSourceDetails.bearerToken,
        },
      };
      break;
    case "basic":
      connectionObject = {
        node: dataSourceDetails.node,
        auth: {
          username: dataSourceDetails.username,
          password: dataSourceDetails.password,
        },
      };
      break;
    case "apiKey":
      connectionObject = {
        node: dataSourceDetails.node,
        auth: {
          apiKey: dataSourceDetails.apiKey,
        },
      };
      break;
    case "cloud":
      connectionObject = {
        cloud: {
          id: dataSourceDetails.cloudId,
        },
        auth: {
          apiKey: dataSourceDetails.apiKey,
        },
      };
      break;
    default:
      throw new Error("Invalid authType");
  }
  if (dataSourceDetails.tls) {
    connectionObject.caFingerprint = dataSourceDetails.caFingerprint;
    connectionObject.tls = {
      rejectUnauthorized: dataSourceDetails.rejectUnauthorized,
    };
  }
  const client = new ESClient(connectionObject);
  try {
    const running = await client.ping();
    if (running) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error sending test log entry to Elasticsearch: ", error);
    return false;
  }
}

async function testPostgreSQLConnection(dataSourceDetails) {
  const connectionObject = {
    host: dataSourceDetails.host,
    port: dataSourceDetails.port,
    user: dataSourceDetails.user,
    password: dataSourceDetails.password,
    database: dataSourceDetails.database,
  };
  if (dataSourceDetails.ssl) {
    const caFilePath = path.join(FILE_DIR, dataSourceDetails.caFilePath);
    const caContent = fs.readFileSync(caFilePath);
    connectionObject.ssl = {
      rejectUnauthorized: dataSourceDetails.rejectUnauthorized,
      ca: caContent,
    };
  }

  const client = new PGClient(connectionObject);

  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch (error) {
    console.error("PostgreSQL connection test failed:", error);
    return false;
  }
}

async function testBigQueryConnection(dataSourceDetails) {
  const connectionObject = {
    projectId: dataSourceDetails.projectId,
  };
  switch (dataSourceDetails.authType) {
    case "api":
      connectionObject.apiKey = dataSourceDetails.apiKey;
      break;
    case "serviceAccountKey":
      connectionObject.keyFileName = path.join(
        FILE_DIR,
        dataSourceDetails.keyFilePath,
      );
      break;
    case "userAccount":
      connectionObject.credentials = {
        client_email: dataSourceDetails.clientEmail,
        private_key: dataSourceDetails.privateKey,
      };
      break;
    default:
      throw new Error(
        "Unsupported Auth Type. Expected either api or service account key but received: ",
        dataSourceDetails.authType,
      );
  }
  const bigQueryClient = new BigQuery(connectionObject);

  try {
    await bigQueryClient.getDatasets();
    return true;
  } catch (error) {
    console.error("BigQuery connection test failed:", error);
    return false;
  }
}

async function testMySQLConnection(dataSourceDetails) {
  try {
    const connectionObject = {
      host: dataSourceDetails.host,
      port: dataSourceDetails.port,
      user: dataSourceDetails.user,
      password: dataSourceDetails.password,
      database: dataSourceDetails.database,
    };
    if (dataSourceDetails.ssl) {
      const caFilePath = path.join(FILE_DIR, dataSourceDetails.caFilePath);
      const caContent = fs.readFileSync(caFilePath);
      connectionObject.ssl = {
        rejectUnauthorized: dataSourceDetails.rejectUnauthorized,
        ca: caContent,
      };
    }
    const connection = await mysql.createConnection(connectionObject);

    await connection.query("SELECT 1");
    await connection.end();
    return true;
  } catch (error) {
    console.error("MySQL connection test failed:", error);
    return false;
  }
}

async function testConnection(dataSourceDetails) {
  try {
    let results;
    switch (dataSourceDetails.dbType) {
      case "mysql":
        results = await testMySQLConnection(
          dataSourceDetails.connectionDetails,
        );
        break;
      case "postgres":
        results = await testPostgreSQLConnection(
          dataSourceDetails.connectionDetails,
        );
        break;
      case "bigquery":
        results = await testBigQueryConnection(
          dataSourceDetails.connectionDetails,
        );
        break;
      case "elasticsearch":
        results = await testElasticSearchConnection(
          dataSourceDetails.connectionDetails,
        );
      default:
        results = null;
    }
    return results ? true : false;
  } catch (error) {
    console.error("Error connecting to DB: ", error);
    return false;
  }
}

module.exports = testConnection;
