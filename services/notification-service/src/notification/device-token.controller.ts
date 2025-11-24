import { Controller, Post, Body } from '@nestjs/common';
import { DeviceTokenService } from './device-token.service';

@Controller('api/device-tokens')
export class DeviceTokenController {
    constructor(private readonly svc: DeviceTokenService) {}

    @Post()
    async register(
        @Body('userId') userId: string,
        @Body('token') token: string,
        @Body('platform') platform: string,
    ) {
        if (!userId || !token) {
            throw new Error('Missing userId or token');
        }
        return this.svc.register(userId, token, platform || 'android');
    }
}
