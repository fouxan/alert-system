const { Client } = require('pg');

async function testPostgreSQLConnection(dataSourceDetails) {
  const client = new Client({
    host: dataSourceDetails.host,
    user: dataSourceDetails.user,
    password: dataSourceDetails.password,
    database: dataSourceDetails.databaseName,
    port: dataSourceDetails.port,
    ssl: dataSourceDetails.ssl ? { rejectUnauthorized: dataSourceDetails.skipTlsVerify !== true } : null,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error);
    return false;
  }
}
