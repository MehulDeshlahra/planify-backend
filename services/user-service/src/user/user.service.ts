import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private repo: Repository<User>) {}

    async create(dto: any) {
        const hash = await bcrypt.hash(dto.password, 12);
        const user = this.repo.create({ name: dto.name, email: dto.email, passwordHash: hash });
        return this.repo.save(user);
    }

    async findByEmail(email: string) {
        return this.repo.findOne({ where: { email } });
    }
}
