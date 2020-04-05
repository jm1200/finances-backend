import { Entity, Column, BaseEntity, PrimaryColumn } from "typeorm";
import { ObjectType, Field } from "type-graphql";

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

  @Field()
  @Column()
  amount: String;
}
