import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlanStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    CANCELLED = 'cancelled',
}

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'creator_id', type: 'uuid' })
    creatorId: string;

    @Column({ type: 'int', default: 1 })
    capacity: number;

    @Column({ type: 'varchar', default: PlanStatus.ACTIVE })
    status: PlanStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
