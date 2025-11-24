import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('plan_join_requests')
export class JoinRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    planId: string;

    @Column()
    userId: string;

    @Column({ default: 'pending' })
    status: 'pending' | 'accepted' | 'rejected';

    @CreateDateColumn()
    createdAt: Date;
}
