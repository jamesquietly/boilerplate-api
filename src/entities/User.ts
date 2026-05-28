import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'citext', unique: true })
  public email: string;

  @Column({ select: false, type: 'varchar', length: 256 })
  public password: string;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;
}
