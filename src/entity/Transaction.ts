import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from "typeorm";
import { ObjectType, Field, Float, Int } from "type-graphql";
import { UserEntity } from "./User";

@ObjectType()
@Entity()
export class TransactionEntity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  transId: String;

  @Field(() => Int!)
  @Column()
  userId: number;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.transactions)
  user: UserEntity;

  @Field()
  @Column()
  account: String;

  @Field()
  @Column()
  type: String;

  @Field()
  @Column()
  datePosted: String;

  @Field()
  @Column()
  name: String;

  @Field()
  @Column()
  memo: String;

  @Field(() => Float)
  @Column({ type: "real" })
  amount: number;
}
