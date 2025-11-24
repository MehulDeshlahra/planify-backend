import { Injectable, Logger } from '@nestjs/common';
import {HttpService} from '@nestjs/axios'
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserClientService {
    private readonly logger = new Logger(UserClientService.name);
    private readonly baseUrl: string;

    constructor(private readonly http: HttpService) {
        this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    }

    /**
     * Fetch user profiles for a list of userIds.
     * Expects User service endpoint: GET /api/users/batch?ids=uid1,uid2
     * Response: { users: [{ id, name, avatarUrl }, ...] }
     */
    async getProfiles(userIds: string[]): Promise<Record<string, { id: string; name?: string; avatarUrl?: string }>> {
        if (!userIds || userIds.length === 0) return {};

        try {
            const idsParam = encodeURIComponent(userIds.join(','));
            const url = `${this.baseUrl}/api/users/batch?ids=${idsParam}`;

            const response$ = this.http.get(url, {
                timeout: 5000,
            });

            const response = await lastValueFrom(response$);
            const users = response?.data?.users ?? [];

            // map by id
            const map: Record<string, any> = {};
            for (const u of users) {
                map[u.id] = { id: u.id, name: u.name, avatarUrl: u.avatarUrl };
            }
            return map;
        } catch (err) {
            this.logger.warn(`Failed to fetch user profiles: ${err.message || err}. Falling back to minimal data.`);
            // graceful fallback: return empty map so callers can still work
            return {};
        }
    }
}
