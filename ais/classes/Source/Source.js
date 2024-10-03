const DataSource = require("../../models/datasource.model");

class Source {
    constructor(sourceId) {
        this.sourceId = sourceId;
        this.connectionDetails = null;
        this.type = null;
    }

    async init() {
        const source = await DataSource.findById(this.sourceId);
        if (!source) {
            throw new Error(`Source not found with sourceId: ${this.sourceId}`);
        }

        this.type = source.dbType;
        this.connectionDetails = source.connectionDetails;
    }

    async getSchema() {
        throw new Error("getSchema method not implemented");
    }

    async runQuery(query) {
        throw new Error("runQuery method not implemented");
    }
}

module.exports = Source;
