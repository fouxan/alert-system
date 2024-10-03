const Source = require("./Source");
const { Client } = require("@elastic/elasticsearch");

class ElasticSearchSource extends Source {
  constructor(sourceId) {
    super(sourceId, connectionDetails);
    this.connection = null;
    this.indexName = null;
  }

  async connect() {
    if (!this.connectionDetails) {
      await this.init();
    }

    if (!this.connection) {
      let connectionObject;
      switch (this.connectionDetails.authType) {
        case "no-auth":
          connectionObject = {
            node: this.connectionDetails.node,
          };
          break;
        case "bearer":
          connectionObject = {
            node: this.connectionDetails.node,
            auth: {
              bearer: this.connectionDetails.bearerToken,
            },
          };
          break;
        case "basic":
          connectionObject = {
            node: this.connectionDetails.node,
            auth: {
              username: this.connectionDetails.username,
              password: this.connectionDetails.password,
            },
          };

          break;
        case "apiKey":
          connectionObject = {
            node: this.connectionDetails.node,
            auth: {
              apiKey: this.connectionDetails.apiKey,
            },
          };
          break;
        case "cloud":
          connectionObject = {
            cloud: {
              id: this.connectionDetails.cloudId,
            },
            auth: {
              username: this.connectionDetails.username,
              password: this.connectionDetails.password,
            },
          };
          break;
        default:
          throw new Error("Invalid authType");
      }
      if (this.connectionDetails.tls) {
        connectionObject.caFingerprint = this.connectionDetails.caFingerprint;
        connectionObject.tls = {
          rejectUnauthorized: this.connectionDetails.rejectUnauthorized,
        };
      }
      this.connection = new Client(connectionObject);
      this.indexName = this.connectionDetails.indexName;
    }
  }

  async getSchema() {
    if (!this.connection) {
      await this.connect();
    }

    const { body } = await this.connection.indices.getMapping({
      index: this.indexName,
    });
    return body;
  }

  async runQuery(query) {
    if (!this.connection) {
      await this.connect();
    }

    const { body } = await this.connection.search({
      index: this.indexName,
      body: query,
    });
    return body.hits.hits;
  }

  async fetchLogs(timeframe) {
    if (!this.connection) {
      await this.connect();
    }
    const { body } = await this.connection.search({
      index: this.indexName,
      body: {
        query: {
          range: {
            "@timestamp": {
              gte: timeframe.startTime,
              lte: timeframe.endTime,
            },
          },
        },
      },
    });

    return body.hits.hits;
  }

  async closeConnection() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = ElasticSearchSource;
