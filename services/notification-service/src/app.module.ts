import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification/notification.controller';
import { KafkaConsumer } from './kafka/kafka.consumer';
import {DeviceToken} from "./entities/device-token.entity";
import {DeviceTokenController} from "./notification/device-token.controller";
import {DeviceTokenService} from "./notification/device-token.service";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            synchronize: true
        }),

        TypeOrmModule.forFeature([Notification,DeviceToken])
    ],
    controllers: [NotificationController,DeviceTokenController],
    providers: [NotificationService, KafkaConsumer,DeviceTokenService],
})
export class AppModule {}
