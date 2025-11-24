import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;
    private readonly logger = new Logger(KafkaService.name);

    onModuleInit = async () => {
        const brokers = (process.env.KAFKA_BROKER || 'localhost:29092').split(',');
        this.kafka = new Kafka({
            clientId: process.env.KAFKA_CLIENT_ID || 'plan-service',
            brokers,
        });
        this.producer = this.kafka.producer();
        await this.producer.connect();
        this.logger.log(`Kafka producer connected to ${brokers.join(',')}`);
    };

    async publish(topic: string, message: any) {
        if (!this.producer) {
            throw new Error('Kafka producer not connected');
        }
        await this.producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
    }

    onModuleDestroy = async () => {
        try {
            if (this.producer) await this.producer.disconnect();
        } catch (err) {
            this.logger.error('Error disconnecting kafka producer', err);
        }
    };
}
