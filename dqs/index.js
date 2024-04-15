const { kafka } = require("./client");
const { performMySQLQuery } = require("./helpers/mysql");
const { performBQQuery } = require("./helpers/bigquery");
const { performPGQuery } = require("./helpers/postgres");

const mapActionTypeToPartition = (actionType) => {
    switch (actionType) {
        case "email":
            return 0;
        case "slack":
            return 1;
        case "webex":
            return 2;
        case "webhook":
            return 3;
        default:
            return 0;
    }
};

const sendMessageToAAS = async ({ alertId, result, actionType }) => {
    const partition = mapActionTypeToPartition(actionType);

    await producer.send({
        topic: "results",
        messages: [{ value: Buffer.from(JSON.stringify({ alertId, result })) }],
        partition: partition,
    });
    console.log("Result published to Kafka");
};

const processMessage = async ({ message, partition }) => {
    console.log(
        `Received message on partition ${partition}:`,
        message.value.toString()
    );

    const { alertId, dbSettings, actionType } = JSON.parse(
        message.value.toString()
    );
    console.log(`Alert ID: ${alertId}, DB Settings:`, dbSettings);

    try {
        let result;
        switch (partition) {
            case 0:
                result = await performMySQLQuery(dbSettings);
                break;
            case 1:
                result = await performBQQuery(dbSettings);
                break;
            case 2:
                result = await performPGQuery(dbSettings);
                break;
            default:
                console.error("Unsupported partition:", partition);
                return;
        }
        console.log(`Query result:`, result);

        // If query execution is successful, send the result to AAS
        await sendMessageToAAS({ alertId, result, actionType });
    } catch (error) {
        console.error(`Query execution failed:`, error);

        // Prepare an error message
        const errorMessage = {
            alertId,
            error: {
                message: error.message,
                // Optionally include more detailed error information
                // stack: error.stack
            },
            actionType,
        };

        // Send the error message to AAS instead of the result
        await sendMessageToAAS({ alertId, result: errorMessage, actionType });
    }
};

const run = async () => {
    const consumer = kafka.consumer({ groupId: "dqs-group" });

    await consumer.connect();
    await consumer.subscribe({ topic: "triggers", fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            await processMessage({ message, partition });
        },
    });

    console.log("Kafka Consumer (DQS) is running");
};

const shutdown = async () => {
    await producer.disconnect();
    await consumer.disconnect();
    console.log("Kafka Consumer (DQS) has stopped");
};

const producer = kafka.producer();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await producer.connect();
run().catch(console.error);
