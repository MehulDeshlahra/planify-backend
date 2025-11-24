// verify-notifs-consumer.js
// Lightweight Kafka consumer to print notifications.push messages.
// Usage: node verify-notifs-consumer.js

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'verify-notif-consumer',
    brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
});

async function run() {
    const consumer = kafka.consumer({
        groupId: 'verify-notifs-group-' + Date.now()
    });
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.NOTIF_TOPIC || 'notifications.push', fromBeginning: true });
    console.log('Subscribed to', process.env.NOTIF_TOPIC || 'notifications.push');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const payload = message.value.toString();
                console.log('--- notification received ---');
                console.log('topic:', topic);
                console.log('payload:', payload);
                console.log('-----------------------------\n');
            } catch (err) {
                console.error('Failed to process message', err);
            }
        },
    });
}

run().catch(err => {
    console.error('Consumer failed', err);
    process.exit(1);
});
