import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    Req,
    UseGuards,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { AuthGuard } from '../auth/auth.guard'; // adjust path if needed
import { Request } from 'express';

@Controller('api/plans')
export class PlansController {
    constructor(private readonly svc: PlansService) {}

    // Create a plan
    @UseGuards(AuthGuard)
    @Post()
    async create(@Req() req: Request & { user?: any }, @Body() dto: CreatePlanDto) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');
        const saved = await this.svc.createPlan(user.sub, dto);
        return { plan: saved };
    }

    // Request to join a plan
    @UseGuards(AuthGuard)
    @Post(':id/join')
    async join(@Req() req: Request & { user?: any }, @Param('id') id: string) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');
        return this.svc.requestJoin(id, user.sub);
    }

    // Owner accepts a join request
    @UseGuards(AuthGuard)
    @Post(':id/requests/:uid/accept')
    async accept(
        @Req() req: Request & { user?: any },
        @Param('id') id: string,
        @Param('uid') uid: string,
    ) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');
        return this.svc.acceptJoin(id, user.sub, uid);
    }

    // List join requests (owner only). Optional query: ?status=pending&page=1&pageSize=20
    @UseGuards(AuthGuard)
    @Get(':id/requests')
    async listRequests(
        @Req() req: Request & { user?: any },
        @Param('id') id: string,
        @Query('status') status?: 'pending' | 'accepted' | 'rejected',
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');

        const p = page ? Math.max(1, parseInt(page, 10)) : 1;
        const ps = pageSize ? Math.min(100, parseInt(pageSize, 10)) : 20;

        return this.svc.getJoinRequests(id, user.sub, status as any, p, ps);
    }

    // Like a plan
    @UseGuards(AuthGuard)
    @Post(':id/like')
    async like(@Req() req: Request & { user?: any }, @Param('id') id: string) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');
        return this.svc.like(id, user.sub);
    }

    // Unlike a plan
    @UseGuards(AuthGuard)
    @Post(':id/unlike')
    async unlike(@Req() req: Request & { user?: any }, @Param('id') id: string) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');
        return this.svc.unlike(id, user.sub);
    }

    // Get plan by id
    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.svc.getPlan(id);
    }

    // Feed - simple home feed (paginated later)
    @Get()
    async feed() {
        return this.svc.getFeed();
    }

    // Owner rejects a join request
    @UseGuards(AuthGuard)
    @Post(':id/requests/:uid/reject')
    async reject(
        @Req() req: Request & { user?: any },
        @Param('id') id: string,
        @Param('uid') uid: string,
    ) {
        const user = req.user;
        if (!user?.sub) throw new BadRequestException('Invalid auth payload');
        return this.svc.rejectJoin(id, user.sub, uid);
    }

    // add endpoint in the controller class
// GET /api/plans/:id/members? page & pageSize
    @UseGuards(AuthGuard)
    @Get(':id/members')
    async members(
        @Req() req: Request & { user?: any },
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        // require auth (so we can show different data if needed later)
        const p = page ? Math.max(1, parseInt(page, 10)) : 1;
        const ps = pageSize ? Math.min(100, parseInt(pageSize, 10)) : 20;

        return this.svc.getMembers(id, p, ps);
    }

}
