const DataSource = require("../models/datasource.model");
const testBigQueryConnection = require("../helpers/testBQ");
const testMySQLConnection = require("../helpers/testMySQL");
const testPostgreSQLConnection = require("../helpers/testPostgreSQL");

exports.createDataSource = async (req, res) => {
    const userId = req.user.id;
    const newDataSource = req.body;

    try {
        let dataSourceDoc = await DataSource.findOne({ userId });

        if (dataSourceDoc) {
            dataSourceDoc.datasources.push(newDataSource);
            await dataSourceDoc.save();
        } else {
            dataSourceDoc = new DataSource({
                userId,
                datasources: [newDataSource],
            });
            await dataSourceDoc.save();
        }

        res.status(201).json({
            message: "Data source added successfully",
            dataSource: dataSourceDoc,
        });
    } catch (error) {
        console.error("Error creating data source:", error);
        res.status(500).json({
            message: "Failed to create data source",
            error: error.message,
        });
    }
};

exports.updateDataSource = async (req, res) => {
    const userId = req.user.id;
    const { datasourceId } = req.params;
    console.log(datasourceId);
    const updateFields = req.body;

    try {
        const dataSourceDoc = await DataSource.findOne({
            userId,
            "datasources._id": datasourceId,
        });

        if (!dataSourceDoc) {
            return res.status(404).json({ message: "Data source not found." });
        }

        const datasource = dataSourceDoc.datasources.id(datasourceId);

        Object.keys(updateFields).forEach((key) => {
            datasource[key] = updateFields[key];
        });

        await dataSourceDoc.save();

        res.json({
            message: "Data source updated successfully.",
            datasource,
        });
    } catch (error) {
        console.error("Error updating data source:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDataSource = async (req, res) => {
    const userId = req.user.id;
    const { datasourceId } = req.params;

    try {
        const dataSourceDoc = await DataSource.findOneAndUpdate(
            { userId },
            { $pull: { datasources: { _id: datasourceId } } },
            { new: true }
        );

        if (!dataSourceDoc) {
            return res
                .status(404)
                .json({ message: "Data source not found or already deleted." });
        }

        res.json({
            message: "Data source deleted successfully.",
            datasources: dataSourceDoc.datasources,
        });
    } catch (error) {
        console.error("Error deleting data source:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDataSource = async (req, res) => {
    const userId = req.user.id;
    const { datasourceId } = req.params;

    try {
        const dataSourceDoc = await DataSource.findOne({
            userId,
            "datasources._id": datasourceId,
        });

        if (!dataSourceDoc) {
            return res.status(404).json({ message: "Data source not found." });
        }

        const datasource = dataSourceDoc.datasources.id(datasourceId);

        res.json(datasource);
    } catch (error) {
        console.error("Error fetching data source:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllDataSources = async (req, res) => {
    const userId = req.user.id;

    try {
        const dataSourceDoc = await DataSource.findOne({ userId });

        if (!dataSourceDoc) {
            return res.status(404).json({ message: "No data sources found." });
        }

        res.json(dataSourceDoc.datasources);
    } catch (error) {
        console.error("Error fetching data sources:", error);
        res.status(500).json({ error: error.message });
    }
};

// TODO: Test this function
exports.testDataSource = async (req, res) => {
    const { datasourceId } = req.params;
    const userId = req.user.id;
    try {
        const dataSource = await DataSource.findById(datasourceId);
        if (!dataSourceDetails) {
            return res.status(404).json({ message: "DataSource not found" });
        }

        let connectionTestResult = false;
        switch (dataSourceDetails.type) {
            case "MySQL":
                connectionTestResult = await testMySQLConnection(
                    dataSourceDetails
                );
                break;
            case "PostgreSQL":
                connectionTestResult = await testPostgreSQLConnection(
                    dataSourceDetails
                );
                break;
            case "BigQuery":
                connectionTestResult = await testBigQueryConnection(
                    dataSourceDetails
                );
                break;
            default:
                return res
                    .status(400)
                    .json({ message: "Unsupported data source type" });
        }

        if (connectionTestResult) {
            res.json({ message: "Connection successful" });
        }
    } catch (error) {
        console.error("Error testing data source, connection failed:", error);
        res.status(500).json({ error: error.message });
    }
};
