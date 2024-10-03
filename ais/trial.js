const { BigQuery } = require("@google-cloud/bigquery");
const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { SqlDatabase } = require("langchain/sql_db");
const { DataSource } = require("typeorm");

const bq = new BigQuery({
	apiKey: "AIzaSyCZp83F-RbDeQOE2WbDICFTq-93qsOpIzs",
	projectId: "plasma-geode-419514",
});

const getSchema = async (datasetName) => {
	const query = `SELECT * FROM \`${datasetName}.INFORMATION_SCHEMA.COLUMNS\``;
	const [job] = await bq.createQueryJob({ query });
	const [rows] = await job.getQueryResults();
	return rows;
};

const transformSchema = (rows) => {
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

	return schema;
};

const getAndTransformSchema = async (datasetName) => {
	try {
		const rows = await getSchema(datasetName);
		const schema = transformSchema(rows);
		return schema;
	} catch (error) {
		console.error("Error fetching or transforming schema:", error);
		throw error;
	}
};

const formatSchema = (schema) => {
	let schemaString = "";
	for (const table in schema) {
		schemaString += `Table: ${table}\nColumns:\n`;
		schema[table].forEach((column) => {
			schemaString += `  - ${column.column_name} (${column.data_type}, nullable: ${column.is_nullable})\n`;
		});
		schemaString += "\n";
	}
	return schemaString;
};

const executeQuery = async (query) => {
	console.log("Executing query:", query);
	const [job] = await bq.createQueryJob({ query });
	const [rows] = await job.getQueryResults();
	return rows;
};

const formatQueryResponse = (response) => {
	let responseString = "";
	response.forEach((row, index) => {
		responseString += `Entry ${index + 1}:\n`;
		for (const key in row) {
			responseString += `  ${key}: ${JSON.stringify(row[key])}\n`;
		}
		responseString += "\n";
	});
	return responseString;
};

const main = async () => {
	const llm = new ChatOpenAI({
		apiKey: "sk-proj-eeBAnaNBW7um8aoVgCzjT3BlbkFJA6uhxk2Dd5so1oKy8WXG",
	});
	const dbType = "bigquery";
	const question = "can you explain the last 5 logs?";
	const datasetId = "emitLogEvents";

	const sqlPrompt =
		PromptTemplate.fromTemplate(`Based on the provided {dbType} table schema below, write a {dbType} query for the dataset {datasetId} that would answer the user's question.
        ------------
        DATASET: {datasetId}
        TABLES: {tableNames}
        SCHEMA: {schema}
        ------------
        QUESTION: {question}
        ------------
        {dbType} QUERY:`);

	const finalResponsePrompt =
		PromptTemplate.fromTemplate(`Based on the {dbType} schema below, question, {dbType} query, and {dbType} response, write a natural language response:
        ------------
        SCHEMA: {schema}
        ------------
        QUESTION: {question}
        ------------
        {dbType} QUERY: {query}
        ------------
        {dbType} RESPONSE: {response}
        ------------
        NATURAL LANGUAGE RESPONSE:`);

	const fullChain = RunnableSequence.from([
		{
			dbType: () => dbType,
			datasetId: () => datasetId,
			schema: async () => {
				const schema = await getAndTransformSchema(datasetId);
				const formattedSchema = formatSchema(schema);
				console.log("Formatted Schema:", formattedSchema);
				return formattedSchema;
			},
			tableNames: async () => {
				const schema = await getAndTransformSchema(datasetId);
				const tableNames = Object.keys(schema);
				console.log("Table Names:", tableNames);
				return tableNames;
			},
			question: () => question,
		},
		sqlPrompt,
		llm,
		new StringOutputParser(),
		{
			query: async (outputs) => {
				console.log("Generated Query:", outputs);
				const query = outputs;
				if (!query) throw new Error("Query is undefined");
				return query;
			},
			response: async (outputs) => {
				console.log("Response for Query:", outputs);
				const response = await executeQuery(outputs);
				console.log("Response for Query:", response);
				if (!response) throw new Error("Response is undefined for query");
				const formattedResponse = formatQueryResponse(response);
				console.log("Formatted Query Response:", formattedResponse);
				return formattedResponse;
			},
		},
		{
			dbType: () => dbType,
			datasetId: () => datasetId,
			schema: async () => {
				const schema = await getAndTransformSchema(datasetId);
				return formatSchema(schema);
			},
			tableNames: async () => {
				const schema = await getAndTransformSchema(datasetId);
				return Object.keys(schema);
			},
			question: () => question,
			query: async (outputs) => {
				const query = outputs.query;
				console.log("Query for Final Response:", query);
				if (!query) throw new Error("Query is undefined for final response");
				return query;
			},
			response: async (outputs) => {
				const response = outputs.response;
				console.log("Response for Final Response:", response);
				if (!response)
					throw new Error("Response is undefined for final response");
				return response;
			},
		},
		finalResponsePrompt,
		llm,
		new StringOutputParser(),
	]);

	try {
		const finalResponse = await fullChain.invoke({
			question: question,
		});
		console.log("Final Response:", finalResponse);
	} catch (error) {
		console.error("Error executing full chain:", error);
	}
};

main().catch(console.error);
