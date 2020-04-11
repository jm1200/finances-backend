import { ObjectType, Field, Int } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";

import { TransactionEntity } from "./Transaction";
import { UserEntity } from "./User";

@ObjectType()
@Entity()
export class CategoryEntity extends BaseEntity {
  @Field(() => Int!)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field(() => Int)
  @Column()
  userId: number;

  //There could be a category but no transactions. so nullable=true
  //@Field(() => [TransactionEntity])
  @OneToMany(() => TransactionEntity, (transaction) => transaction.category)
  transactions: TransactionEntity[];

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.categories)
  user: UserEntity;
}
