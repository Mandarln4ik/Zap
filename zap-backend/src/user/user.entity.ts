import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  login: string; // Unique identifier like Telegram @username

  @Column()
  username: string; // Display name

  @Column({ select: false }) // Exclude password from default queries
  password: string;

  @Column({ nullable: true })
  avatar: string; // URL or path to avatar image

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
