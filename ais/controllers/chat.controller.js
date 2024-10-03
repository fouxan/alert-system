const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const createSource = require("../classes/Source");
const { createLLM } = require("../classes/AIModel");

const chatWithDatabase = async (req, res) => {
	const { question } = req.body;
	const { modelId, sourceId } = req.params;
	try {
		const llm = await createLLM(modelId);
		const source = await createSource(sourceId);
		const dbType = source.type;

		const sqlPrompt =
			PromptTemplate.fromTemplate(`Based on the provided {dbType} table schema below, write a {dbType} query that would answer the user's question.
            ------------
            SCHEMA: {schema}
            ------------
            QUESTION: {question}
            ------------
            {dbType} QUERY:`);

		const bqPrompt =
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
				dbType: async () => source.type,
				datasetId: async () => source?.datasetId,
				tableNames: async () => {
					const schema = await source.getSchema();
					const tableNames = Object.keys(schema?.rawSchema);
					return tableNames;
				},
				schema: async () => {
					const schema = await source.getSchema();
					return dbType === "bigquery" ? schema?.formattedSchema : schema;
				},
				question: async (inputs) => inputs.question,
			},
			dbType === "bigquery" ? bqPrompt : sqlPrompt,
			llm,
			new StringOutputParser(),
			{
				query: async (outputs) => outputs,
				response: async (outputs) => await source.runQuery(outputs),
			},
			{
				dbType: () => source.type,
				datasetId: async () => source?.datasetId,
				tableNames: async (outputs) => outputs.tableNames,
				schema: async (outputs) => outputs.schema,
				question: async (inputs) => inputs.question,
				query: async (outputs) => outputs.query,
				response: async (outputs) => outputs.response,
			},
			finalResponsePrompt,
			llm,
			new StringOutputParser(),
		]);

		const finalResponse = await fullChain.invoke({
			question: question,
		});

		res.json({
			answer: finalResponse,
		});
	} catch (error) {
		console.error("Error executing full chain:", error);
		res.status(500).json({ error: "Failed to execute full chain" });
	}
};

const chatWithLogs = async (req, res) => {
	const { question, timeframe } = req.body;
	const { sourceId, llmId, temId } = req.params;
	try {
		const source = await createSource(sourceId);
		const llm = await createLLM(llmId);
		let relevantText;
		// if (temId) {
		// 	const tem = await createSource(temId);
		// 	const vectorStore = await tem.getVectorStore();
		// 	const relevantChunks = await vectorStore.similaritySearch(question, 5);
		// 	relevantText = relevantChunks.map((chunk) => chunk.text).join("\n");
		// }
		const logs = await source.fetchLogs(timeframe);
		console.log(logs);
		const prompt = PromptTemplate.fromTemplate(
			"Based on the following logs and the provided text, answer the following question:\n\nQuestion: {question}\n\nLogs: {logs}\n\nAnswer:"
		);
		const chain = RunnableSequence.from([
			{
				question: async (inputs) => inputs.question,
				// relevantText: async () => relevantText,
				logs: async () => logs,
			},
			prompt,
			llm,
			new StringOutputParser(),
		]);

		const response = await chain.invoke({
			question: question,
		});

		res.status(200).json({ response: response });
	} catch (error) {
		console.error("Error executing full chain:", error);
		res.status(500).json({ error: "Failed to execute full chain" });
	}
};

module.exports = {
	chatWithDatabase,
	chatWithLogs,
};
