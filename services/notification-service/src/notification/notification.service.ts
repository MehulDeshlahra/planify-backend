import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { DeviceToken } from '../entities/device-token.entity';
import { Repository } from 'typeorm';
import { DeviceTokenService } from './device-token.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
    private logger = new Logger(NotificationService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly repo: Repository<Notification>,

        private readonly deviceTokens: DeviceTokenService
    ) {
        // Initialize Firebase only if environment variables are provided
        if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY
                ?.replace(/\\n/g, '\n'); // Convert \n to real newlines

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                })
            });

            this.logger.log("Firebase initialized");
        }
    }

    // Called by Kafka consumer
    async handleIncoming(payload: any) {
        const { userId, event, title, message, data } = payload;

        if (!userId) {
            this.logger.warn("Notification received with no userId, skipping.");
            return;
        }

        // Save notification in DB
        const notif = this.repo.create({
            userId,
            event,
            title,
            message,
            data
        });

        const saved = await this.repo.save(notif);
        this.logger.log(`Notification saved ${saved.id} → user ${saved.userId}`);

        // Send push if token(s) exist
        const tokens = await this.deviceTokens.getTokens(userId);

        if (tokens.length > 0) {
            await this.sendPush(tokens, title, message, data);
        }
    }

    async list(userId: string, page = 1, pageSize = 20) {
        const [items, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        });

        return {
            items,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    async markRead(id: string, userId: string) {
        const notif = await this.repo.findOne({ where: { id, userId } });
        if (!notif) throw new Error("Notification not found");

        notif.read = true;
        return this.repo.save(notif);
    }

    // Push notification sender (FCM)
    async sendPush(tokens: string[], title: string, message: string, data: any) {
        if (!admin.apps.length) {
            this.logger.warn("Firebase not initialized — skipping push");
            return;
        }

        const payload = {
            notification: {
                title,
                body: message
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            tokens
        };

        try {
            const response = await admin.messaging().sendMulticast(payload);
            this.logger.log(
                `Push delivered: success=${response.successCount}, failed=${response.failureCount}`
            );
        } catch (err) {
            this.logger.error("Push delivery failed", err);
        }
    }
}
