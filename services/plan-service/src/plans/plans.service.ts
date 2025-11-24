import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';

import { Plan } from './entities/plan.entity';
import { JoinRequest } from './entities/join-request.entity';
import { Like } from './entities/like.entity';

import { CreatePlanDto } from './dto/create-plan.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { UserClientService } from '../users/user-client.service';

type JoinStatus = 'pending' | 'accepted' | 'rejected';

@Injectable()
export class PlansService {
    private readonly logger = new Logger(PlansService.name);
    private readonly notificationTopic = 'notifications.push';

    constructor(
        @InjectRepository(Plan) private readonly plansRepo: Repository<Plan>,
        @InjectRepository(JoinRequest) private readonly joinRepo: Repository<JoinRequest>,
        @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
        private readonly kafka: KafkaProducerService,
        private readonly userClient: UserClientService,
    ) {}

    // -------------------------
    // CREATE PLAN
    // -------------------------
    async createPlan(creatorId: string, dto: CreatePlanDto) {
        const plan = this.plansRepo.create({
            ...dto,
            creatorId,
        });

        const saved = await this.plansRepo.save(plan);

        // publish domain event
        await this.kafka.send('plan.created', saved);

        // Optionally notify followers / subscribers in future.
        return saved;
    }

    // -------------------------
    // REQUEST TO JOIN
    // -------------------------
    async requestJoin(planId: string, userId: string) {
        const plan = await this.plansRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        const exists = await this.joinRepo.findOne({
            where: { planId, userId },
        });
        if (exists) throw new BadRequestException('Request already exists');

        const req = this.joinRepo.create({
            planId,
            userId,
            status: 'pending' as JoinStatus,
        });

        await this.joinRepo.save(req);

        // domain event
        await this.kafka.send('plan.join.requested', req);

        // notification event to plan owner
        try {
            const notif = {
                event: 'plan.join.requested',
                userId: plan.creatorId, // target user to receive notification
                title: 'New join request',
                message: `${userId} requested to join your plan "${plan.title}"`,
                data: {
                    planId: plan.id,
                    requesterId: userId,
                    joinRequestId: req.id,
                },
                meta: {
                    source: 'plan-service',
                    createdAt: new Date().toISOString(),
                },
            };
            await this.kafka.send(this.notificationTopic, notif);
        } catch (err) {
            this.logger.warn('Failed to emit notification for join.requested: ' + (err?.message ?? err));
        }

        return { message: 'Join request sent' };
    }

    // -------------------------
    // ACCEPT JOIN
    // -------------------------
    async acceptJoin(planId: string, ownerId: string, targetUserId: string) {
        const plan = await this.plansRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        if (plan.creatorId !== ownerId) {
            throw new ForbiddenException('Not the owner of this plan');
        }

        const req = await this.joinRepo.findOne({
            where: { planId, userId: targetUserId },
        });

        if (!req) throw new BadRequestException('Join request not found');

        req.status = 'accepted' as JoinStatus;
        await this.joinRepo.save(req);

        // domain event
        await this.kafka.send('plan.join.accepted', req);

        // notification to the user who requested
        try {
            const notif = {
                event: 'plan.join.accepted',
                userId: targetUserId,
                title: 'Join request accepted',
                message: `Your request to join "${plan.title}" has been accepted.`,
                data: {
                    planId: plan.id,
                    by: ownerId,
                    joinRequestId: req.id,
                },
                meta: {
                    source: 'plan-service',
                    createdAt: new Date().toISOString(),
                },
            };
            await this.kafka.send(this.notificationTopic, notif);
        } catch (err) {
            this.logger.warn('Failed to emit notification for join.accepted: ' + (err?.message ?? err));
        }

        return { message: 'User added to plan' };
    }

    // -------------------------
    // REJECT JOIN
    // -------------------------
    async rejectJoin(planId: string, ownerId: string, targetUserId: string) {
        const plan = await this.plansRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        if (plan.creatorId !== ownerId) {
            throw new ForbiddenException('Not the owner of this plan');
        }

        const req = await this.joinRepo.findOne({
            where: { planId, userId: targetUserId },
        });

        if (!req) throw new BadRequestException('Join request not found');

        req.status = 'rejected' as JoinStatus;
        await this.joinRepo.save(req);

        // Emit domain event
        await this.kafka.send('plan.join.rejected', req);

        // Notify the requester
        try {
            const notif = {
                event: 'plan.join.rejected',
                userId: targetUserId,
                title: 'Join request rejected',
                message: `Your request to join "${plan.title}" was rejected by the organizer.`,
                data: {
                    planId: plan.id,
                    by: ownerId,
                    joinRequestId: req.id,
                },
                meta: {
                    source: 'plan-service',
                    createdAt: new Date().toISOString(),
                },
            };
            await this.kafka.send(this.notificationTopic, notif);
        } catch (err) {
            this.logger.warn('Failed to emit notification for join.rejected: ' + (err?.message ?? err));
        }

        return { message: 'Join request rejected' };
    }

    // -------------------------
    // LIKE
    // -------------------------
    async like(planId: string, userId: string) {
        const already = await this.likeRepo.findOne({
            where: { planId, userId },
        });

        if (already) throw new BadRequestException('Already liked');

        const like = this.likeRepo.create({ planId, userId });
        await this.likeRepo.save(like);

        // domain event
        await this.kafka.send('plan.liked', { planId, userId });

        // notify plan owner (skip if user is the owner)
        try {
            const plan = await this.plansRepo.findOne({ where: { id: planId } });
            if (plan && plan.creatorId !== userId) {
                const notif = {
                    event: 'plan.liked',
                    userId: plan.creatorId,
                    title: 'Someone liked your plan',
                    message: `${userId} liked your plan "${plan.title}"`,
                    data: {
                        planId: plan.id,
                        likedBy: userId,
                    },
                    meta: {
                        source: 'plan-service',
                        createdAt: new Date().toISOString(),
                    },
                };
                await this.kafka.send(this.notificationTopic, notif);
            }
        } catch (err) {
            this.logger.warn('Failed to emit notification for plan.liked: ' + (err?.message ?? err));
        }

        return { message: 'Liked' };
    }

    // -------------------------
    // UNLIKE
    // -------------------------
    async unlike(planId: string, userId: string) {
        await this.likeRepo.delete({ planId, userId });

        await this.kafka.send('plan.unliked', { planId, userId });

        // we do not notify on unlike (no need)
        return { message: 'Unliked' };
    }

    // -------------------------
    // GET PLAN
    // -------------------------
    async getPlan(planId: string) {
        const plan = await this.plansRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');
        return plan;
    }

    // -------------------------
    // BASIC FEED
    // -------------------------
    async getFeed() {
        return this.plansRepo.find({
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }

    // -------------------------
    // GET JOIN REQUESTS (owner only)
    // -------------------------
    async getJoinRequests(
        planId: string,
        requesterId: string,
        status?: JoinStatus,
        page = 1,
        pageSize = 20,
    ) {
        // validate plan and ownership
        const plan = await this.plansRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');
        if (plan.creatorId !== requesterId) throw new ForbiddenException('Not the owner');

        const where: any = { planId };
        if (status) where.status = status;

        const options: FindManyOptions<JoinRequest> = {
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        };

        const [items, total] = await this.joinRepo.findAndCount(options);

        // Enrich: fetch unique userIds and request profiles from UserService
        const userIds = Array.from(new Set(items.map(i => i.userId)));
        const profilesMap = await this.userClient.getProfiles(userIds).catch(() => ({}));

        // Attach profile to each item (non-destructive)
        const enriched = items.map(i => ({
            ...i,
            user: profilesMap[i.userId] ?? { id: i.userId }, // minimal fallback
        }));

        return {
            items: enriched,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    // -------------------------
    // GET MEMBERS
    // -------------------------
    async getMembers(planId: string, page = 1, pageSize = 20) {
        const plan = await this.plansRepo.findOne({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        const where = { planId, status: 'accepted' as JoinStatus };

        const options: FindManyOptions<JoinRequest> = {
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        };

        const [items, total] = await this.joinRepo.findAndCount(options);

        const userIds = Array.from(new Set(items.map(i => i.userId)));
        const profilesMap = await this.userClient.getProfiles(userIds).catch(() => ({}));

        const members = items.map(i => ({
            userId: i.userId,
            joinedAt: i.createdAt,
            user: profilesMap[i.userId] ?? { id: i.userId },
        }));

        return {
            members,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
}
