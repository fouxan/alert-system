const { Client } = require("@elastic/elasticsearch");

const client = new Client({
	node: "https://15c0-49-204-29-57.ngrok-free.app",
    auth: {
        username: "elastic",
        password: "password",
    },
});

const main = async () => {
	const response = await client.index({index: "logs_def"});
    // const response = await client.ping();
    console.log(response);
};

main().catch(console.error);
