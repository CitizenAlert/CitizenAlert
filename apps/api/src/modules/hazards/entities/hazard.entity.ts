import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum HazardType {
  ACCIDENT = 'accident',
  ROAD_ISSUE = 'road_issue',
  WARNING = 'warning',
  POLICE = 'police',
  OTHER = 'other',
}

export enum HazardStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
}

@Entity('hazards')
export class Hazard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: HazardType,
    default: HazardType.OTHER,
  })
  type: HazardType;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: HazardStatus,
    default: HazardStatus.ACTIVE,
  })
  status: HazardStatus;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
