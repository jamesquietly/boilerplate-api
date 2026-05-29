import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './User';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'uuid', unique: true })
  public tokenId: string;

  @Column({ type: 'varchar', length: 256 })
  public tokenHash: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public user: User;

  @Column({ type: 'timestamp' })
  public expiresAt: Date;

  @CreateDateColumn()
  public createdAt: Date;
}
