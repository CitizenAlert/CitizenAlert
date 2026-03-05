import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Hazard } from '../../hazards/entities/hazard.entity';

export enum NotificationType {
  HAZARD_CREATED = 'hazard_created',
  HAZARD_STATUS_CHANGED = 'hazard_status_changed',
  HAZARD_NEARBY = 'hazard_nearby',
  HAZARD_COMMENT = 'hazard_comment',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  hazardId: string;

  @ManyToOne(() => Hazard, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'hazardId' })
  hazard: Hazard;

  @Column({ type: 'json', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
