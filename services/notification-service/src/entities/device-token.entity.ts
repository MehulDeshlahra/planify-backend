import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_device_tokens')
export class DeviceToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    token: string; // FCM or APNs token

    @Column({ default: 'android' })
    platform: string; // android / ios

    @CreateDateColumn()
    createdAt: Date;
}
