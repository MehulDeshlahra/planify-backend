import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceToken } from '../entities/device-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DeviceTokenService {
    constructor(
        @InjectRepository(DeviceToken)
        private readonly repo: Repository<DeviceToken>,
    ) {}

    async register(userId: string, token: string, platform: string) {
        const exists = await this.repo.findOne({
            where: { userId, token },
        });

        if (!exists) {
            const entity = this.repo.create({ userId, token, platform });
            await this.repo.save(entity);
        }

        return { success: true };
    }

    async getTokens(userId: string) {
        const list = await this.repo.find({ where: { userId } });
        return list.map(t => t.token);
    }
}
