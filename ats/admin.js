const kafka = require("./client");

const init = async () => {
    const admin = kafka.admin();
    await admin.connect();
    console.log("Kafka Admin connected and ready.");

    await admin.createTopics({
        topics: [
            {
                topic: "triggers",
                numPartitions: 3,
            },
        ],
    });
    console.log("Topics [alerts] with {3} parts created successfully.");

    await admin.disconnect();
};

init();
