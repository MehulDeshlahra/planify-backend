const { Kafka } = require("kafkajs");

async function main() {
    const kafka = new Kafka({
        clientId: "test-producer",
        brokers: ["localhost:29092"],
    });

    const producer = kafka.producer();
    await producer.connect();
    console.log("Producer connected");

    await producer.send({
        topic: "notifications.push",
        messages: [
            { value: JSON.stringify({ event: "test", msg: "hello world" }) }
        ]
    });

    console.log("Message sent");
    process.exit(0);
}

main();
