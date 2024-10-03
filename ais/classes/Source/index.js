const MySQLSource = require("./MySQLSource");
const PostgresSource = require("./PostgresSource");
const BigQuerySource = require("./BigQuerySource");
const ElasticSearchSource = require("./ElasticSearchSource");
const Source = require("../../models/datasource.model");

const createSource = async (sourceId) => {
    const source = await Source.findById(sourceId);
    if (!source) {
        throw new Error(`Source with ID ${sourceId} not found`);
    }

    switch (source.dbType.toLowerCase()) {
        case "mysql":
            return new MySQLSource(sourceId);

        case "postgres":
            return new PostgresSource(sourceId);

        case "bigquery":
            return new BigQuerySource(sourceId);

        case "elasticsearch":
            return new ElasticSearchSource(sourceId);

        default:
            throw new Error(
                `Unsupported source type: ${source.type}`
            );
    }
};

module.exports = createSource;
