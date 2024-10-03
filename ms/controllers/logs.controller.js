// TODO: Implement get, create logs functions. get history functions
const { Client } = require('@elastic/elasticsearch');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

exports.createLogsFromFile = async (req, res) => {
    const { logs, esSettings } = req.body;

    if (!logs || !esSettings) {
        return res.status(400).json({ error: 'logs and esSettings are required' });
    }

    const { host, port, index, username, password } = esSettings;

    const esClient = new Client({
        node: `http://${username}:${password}@${host}:${port}`
    });

    try {
        const body = logs.flatMap(log => [{ index: { _index: index } }, log]);

        const { body: bulkResponse } = await esClient.bulk({
            refresh: true,
            body
        });

        if (bulkResponse.errors) {
            const erroredDocuments = [];
            bulkResponse.items.forEach((action, i) => {
                const operation = Object.keys(action)[0];
                if (action[operation].error) {
                    erroredDocuments.push({
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1]
                    });
                }
            });

            return res.status(500).json({ error: 'Failed to send logs to Elasticsearch', erroredDocuments });
        }

        res.status(200).json({ message: 'Logs created and sent to Elasticsearch' });
    } catch (error) {
        console.error('Error sending logs to Elasticsearch:', error);
        res.status(500).json({ error: 'Failed to send logs to Elasticsearch' });
    }
}

exports.getLogs = async (req, res) => {
    const { esSettings, query } = req.body;

    if (!esSettings) {
        return res.status(400).json({ error: 'esSettings is required' });
    }

    const { host, port, index, username, password } = esSettings;

    const esClient = new Client({
        node: `http://${username}:${password}@${host}:${port}`
    });

    try {
        const { body } = await esClient.search({
            index,
            body: query
        });

        res.status(200).json({ logs: body.hits.hits });
    } catch (error) {
        console.error('Error getting logs from Elasticsearch:', error);
        res.status(500).json({ error: 'Failed to get logs from Elasticsearch' });
    }
}

exports.getHistory = async (req, res) => {
    const { esSettings, query } = req.body;

    if (!esSettings) {
        return res.status(400).json({ error: 'esSettings is required' });
    }

    const { host, port, index, username, password } = esSettings;

    const esClient = new Client({
        node: `http://${username}:${password}@${host}:${port}`
    });

    try {
        const { body } = await esClient.search({
            index,
            body: query
        });

        res.status(200).json({ logs: body.hits.hits });
    } catch (error) {
        console.error('Error getting history from Elasticsearch:', error);
        res.status(500).json({ error: 'Failed to get history from Elasticsearch' });
    }
}

exports.getStats = async(req, res) => {};

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

const sendLogFileToES = async (req, res) => {
    const { esSettings } = req.body;
    const file = req.file;

    if (!file || !esSettings) {
        return res.status(400).json({ error: 'File and esSettings are required' });
    }

    const { host, port, index, username, password } = esSettings;

    const esClient = new Client({
        node: `http://${username}:${password}@${host}:${port}`
    });

    const filePath = path.join(__dirname, file.path);

    try {
        const logData = fs.readFileSync(filePath, 'utf8');

        const logEntries = logData.split('\n').filter(entry => entry).map(entry => ({
            index: { _index: index }
        })).map((entry, index) => [entry, logData.split('\n')[index]]).flat();

        const response = await esClient.bulk({
            body: logEntries.map(entry => ({
                index: { _index: index, body: JSON.parse(entry) }
            }))
        });

        // Delete the file after processing
        fs.unlinkSync(filePath);

        res.status(200).json({ message: 'Log file contents sent to Elasticsearch', response });
    } catch (error) {
        console.error('Error sending log file contents to Elasticsearch:', error);
        res.status(500).json({ error: 'Failed to send log file contents to Elasticsearch' });
    }
};
