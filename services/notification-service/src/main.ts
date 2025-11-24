import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { KafkaConsumer } from './kafka/kafka.consumer';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const port = process.env.PORT || 3004;
    await app.listen(port);
    console.log(`NotificationService running on port ${port}`);

    const consumer = app.get(KafkaConsumer);
    consumer.start();
}

bootstrap();
