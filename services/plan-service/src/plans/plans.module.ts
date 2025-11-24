import { Module } from '@nestjs/common';
import {HttpModule} from '@nestjs/axios'
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';
import { JoinRequest } from './entities/join-request.entity';
import { Like } from './entities/like.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { UserClientService } from '../users/user-client.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan, JoinRequest, Like]),
        HttpModule, // for UserClientService
    ],
    controllers: [PlansController],
    providers: [PlansService, KafkaProducerService, UserClientService],
})
export class PlansModule {}
