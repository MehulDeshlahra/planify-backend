import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    creatorId: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    location: string;

    @Column()
    time: string;

    @CreateDateColumn()
    createdAt: Date;
}
