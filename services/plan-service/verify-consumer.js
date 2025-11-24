// verify-consumer.js
const { Kafka } = require('kafkajs');

async function run() {
    const kafka = new Kafka({ clientId: 'verify-client', brokers: ['localhost:29092'] });
    const consumer = kafka.consumer({ groupId: 'verify-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'plan.created', fromBeginning: true });

    console.log('Subscribed to plan.created — waiting messages...');
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log('message:', { value: message.value.toString() });
        },
    });
}

run().catch(err => console.error(err));
