import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
    private producer: Producer;

    async onModuleInit() {
        const kafka = new Kafka({
            clientId: 'plan-service',
            brokers: ['localhost:29092'],
        });

        this.producer = kafka.producer();
        await this.producer.connect();
        console.log('Kafka producer connected');
    }

    async send(topic: string, message: any) {
        await this.producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
    }
}
