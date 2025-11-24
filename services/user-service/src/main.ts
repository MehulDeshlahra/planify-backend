import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 3000;
    console.log("ENV DATABASE_URL =", process.env.DATABASE_URL);
    await app.listen(port);
    console.log(`User Service running on http://localhost:${port}`);
}
bootstrap();

