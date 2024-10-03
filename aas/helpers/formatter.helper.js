const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

// Function to format query results into a readable string
const getFormattedResults = (queryResults) => {
  let formattedResults = "";

  if (Array.isArray(queryResults)) {
    queryResults.forEach((result, index) => {
      formattedResults += `Result ${index + 1}:\n`;
      for (const [key, value] of Object.entries(result)) {
        formattedResults += `  ${key}: ${value}\n`;
      }
      formattedResults += "\n";
    });
  } else if (typeof queryResults === "object") {
    formattedResults = "Query Results:\n";
    for (const [key, value] of Object.entries(queryResults)) {
      formattedResults += `  ${key}: ${value}\n`;
    }
  }

  return formattedResults;
};

// Function to generate a CSV file from query results
const getCsvFile = (queryResults) => {
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(queryResults);

  // Generate a unique file name for the CSV file
  const csvFilePath = path.join(__dirname, "results.csv");

  fs.writeFileSync(csvFilePath, csv);
  console.log("CSV file has been saved.");

  return csvFilePath;
};

module.exports = {
  getFormattedResults,
  getCsvFile,
};
