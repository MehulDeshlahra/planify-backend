import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('plan_likes')
@Unique(['planId', 'userId'])
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    planId: string;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
