const { kafka } = require("./producer");

const init = async () => {
    const admin = kafka.admin();
    await admin.connect();
    console.log("Kafka Admin connected and ready.");
    await admin.createTopics({
        topics: [{ topic: "triggers", numPartitions: 4 }],
    });
    console.log("Topics [triggers] with 4 partitions created successfully.");
    await admin.disconnect();
};

init();
