import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UsersEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
}
