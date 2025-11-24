import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import * as jwt from 'jsonwebtoken';

@Controller('api/users')
export class UserController {
    constructor(private readonly svc: UserService) {}

    @Post('register')
    async register(@Body() dto: CreateUserDto) {
        const user = await this.svc.create(dto);
        const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '30m' });
        return { user: { id: user.id, name: user.name, email: user.email }, token };
    }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        const user = await this.svc.findByEmail(body.email);
        if (!user) return { error: 'Invalid credentials' };
        const ok = await require('bcrypt').compare(body.password, user.passwordHash);
        if (!ok) return { error: 'Invalid credentials' };
        const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '30m' });
        return { token, user: { id: user.id, name: user.name, email: user.email } };
    }
}
