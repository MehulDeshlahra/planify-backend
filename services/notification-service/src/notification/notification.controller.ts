import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('api/notifications')
export class NotificationController {
    constructor(private readonly svc: NotificationService) {}

    @Get()
    async list(
        @Query('userId') userId: string,
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '20',
    ) {
        return this.svc.list(userId, parseInt(page), parseInt(pageSize));
    }

    @Post(':id/read')
    async markRead(
        @Param('id') id: string,
        @Query('userId') userId: string,
    ) {
        return this.svc.markRead(id, userId);
    }
}
