import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers.authorization;

        if (!auth) throw new UnauthorizedException('Missing auth header');

        const [type, token] = auth.split(' ');
        if (type !== 'Bearer' || !token) throw new UnauthorizedException('Invalid token');

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
