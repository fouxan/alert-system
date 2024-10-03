const { PromptTemplate } = require("@langchain/core/prompts");

const getQueryPrompt = async (options) => {
    switch (options.dbType) {
        case "postgres":
        case "mysql":
            return PromptTemplate.fromTemplate(`Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
            ------------
            SCHEMA: {schema}
            ------------
            QUESTION: {question}
            ------------
            SQL QUERY:`);
        case "bigquery":
            return PromptTemplate.fromTemplate(`Based on the provided BigQuery table schema below, write a BigQuery query that would answer the user's question.
            ------------
            SCHEMA: {schema}
            ------------
            QUESTION: {question}
            ------------
            BigQuery QUERY:`);
    }

};
