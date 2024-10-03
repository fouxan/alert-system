const Source = require("./Source");
const { BigQuery } = require("@google-cloud/bigquery");

class BigQuerySource extends Source {
	constructor(sourceId) {
		super(sourceId);
		this.connection = null;
		this.type = "bigquery";
	}

	async connect() {
		if (!this.connectionDetails) {
			await this.init();
		}

		if (!this.connection) {
			let connectionObject = {
				projectId: this.connectionDetails.projectId,
			};
			if (this.connectionDetails.authType === "apiKey") {
				connectionObject.apiKey = this.connectionDetails.apiKey;
			} else if (this.connectionDetails.authType === "keyFile") {
				// this will be path where we store the file.
				connectionObject.keyFilename = this.connectionDetails.keyFilename;
			} else {
				connectionObject.credentials = {
					client_email: this.connectionDetails.clientEmail,
					private_key: this.connectionDetails.privateKey,
				};
			}
			this.connection = new BigQuery(connectionObject);
		}
	}

	async getSchema() {
		if (!this.connection) {
			await this.connect();
		}
		const query = `SELECT * FROM \`${this.connectionDetails.dataset}.INFORMATION_SCHEMA.COLUMNS\``;
		const [job] = await this.connection.createQueryJob({ query });
		const [rows] = await job.getQueryResults();
		const schema = {};

		rows.forEach((row) => {
			const tableName = row.table_name;
			if (!schema[tableName]) {
				schema[tableName] = [];
			}
			schema[tableName].push({
				column_name: row.column_name,
				data_type: row.data_type,
				is_nullable: row.is_nullable,
			});
		});

		let schemaString = "";
		for (const table in schema) {
			schemaString += `Table: ${table}\nColumns:\n`;
			schema[table].forEach((column) => {
				schemaString += `  - ${column.column_name} (${column.data_type}, nullable: ${column.is_nullable})\n`;
			});
			schemaString += "\n";
		}
		return { formattedSchema: schemaString, rawSchema: schema };
	}

	async runQuery(query) {
		if (!this.connection) {
			await this.connect();
		}
		const [job] = await this.connection.createQueryJob({ query });
		const [rows] = await job.getQueryResults();
		let responseString = "";
		rows.forEach((row, index) => {
			responseString += `Entry ${index + 1}:\n`;
			for (const key in row) {
				responseString += `  ${key}: ${JSON.stringify(row[key])}\n`;
			}
			responseString += "\n";
		});
		return responseString;
	}
}

module.exports = BigQuerySource;
