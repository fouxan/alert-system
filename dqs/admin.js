const kafka = require("./client");

const init = async () => {
    const admin = kafka.admin();
    await admin.connect();
    console.log("Kafka Admin connected and ready.");

    await admin.createTopics({
        topics: [
            {
                topic: "results",
                numPartitions: 4,
            },
        ],
    });
    console.log("Topics [results] with {4} parts created successfully.");

    await admin.disconnect();
};

init();
