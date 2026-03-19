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
  INONDATION = 'inondation',
  FUITE_EAU = 'fuite_eau',
  ARBRE_TOMBE = 'arbre_tombe',
  DEPOT_SAUVAGE = 'depot_sauvage',
  NID_DE_POULE = 'nid_de_poule',
  ECLAIRAGE_PUBLIC_DEFECTUEUX = 'eclairage_public_defectueux',
  FEU_TRICOLORE_PANNE = 'feu_tricolore_panne',
  TROTTOIR_VOIRIE_DEGRADE = 'trottoir_voirie_degrade',
  MOBILIER_URBAIN_DETERIORE = 'mobilier_urbain_deteriore',
  NUISIBLES_INSALUBRITE = 'nuisibles_insalubrite',
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
    default: HazardType.NID_DE_POULE,
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

  @Column({ nullable: true })
  city: string;

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
