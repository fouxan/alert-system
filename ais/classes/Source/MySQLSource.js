const Source = require("./Source");
const { DataSource } = require("typeorm");
const { SqlDatabase } = require("langchain/sql_db");

class MySQLSource extends Source {
    constructor(sourceId) {
        super(sourceId);
        this.dataSource = null;
        this.connection = null;
        this.type = "mysql";
    }

    async connect() {
        if (!this.connectionDetails) {
            await this.init();
        }

        if (!this.dataSource || !this.dataSource.isInitialized) {
            this.dataSource = new DataSource({
                type: "mysql",
                host: this.connectionDetails.host,
                port: this.connectionDetails.port,
                username: this.connectionDetails.username,
                password: this.connectionDetails.password,
                database: this.connectionDetails.database,
            });
            await this.dataSource.initialize();
        }

        if (!this.connection) {
            this.connection = await SqlDatabase.fromDataSourceParams({
                appDataSource: this.dataSource,
            });
        }
    }

    async getSchema() {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            await this.connect();
        }
        const schema = await this.connection.getTableInfo();
        return schema;
    }

    async runQuery(query) {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            await this.connect();
        }
        return this.connection.run(query);
    }
}

module.exports = MySQLSource;
