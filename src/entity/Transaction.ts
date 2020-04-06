import { Entity, Column, BaseEntity, PrimaryColumn } from "typeorm";
import { ObjectType, Field, Float, Int } from "type-graphql";

@ObjectType()
@Entity("transactions")
export class Transaction extends BaseEntity {
  @Field()
  @PrimaryColumn()
  transId: String;

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
