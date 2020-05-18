import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm";

@ObjectType()
@Entity()
export class BudgetsEntity extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  userId: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: "text" })
  values: string;
}
