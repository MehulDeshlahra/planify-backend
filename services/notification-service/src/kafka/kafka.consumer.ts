import { Injectable, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class KafkaConsumer {
    private logger = new Logger(KafkaConsumer.name);
    private kafka;
    private consumer;

    constructor(private readonly notifService: NotificationService) {
        this.kafka = new Kafka({
            clientId: 'notification-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
        });

        this.consumer = this.kafka.consumer({
            groupId: 'notification-service-group',
        });
    }

    async start() {
        await this.consumer.connect();

        const topic = process.env.NOTIF_TOPIC || 'notifications.push';
        await this.consumer.subscribe({ topic, fromBeginning: false });

        this.logger.log(`Kafka consumer subscribed to ${topic}`);

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const payload = JSON.parse(message.value.toString());
                    await this.notifService.handleIncoming(payload);
                } catch (err) {
                    this.logger.error("Failed to process event", err);
                }
            }
        });
    }
}
