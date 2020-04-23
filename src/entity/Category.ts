import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";

import { TransactionEntity } from "./Transaction";
import { SubCategoryEntity } from "./SubCategory";
import { UserEntity } from "./User";

@ObjectType()
@Entity()
export class CategoryEntity extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  //Foreign Key
  @Field()
  @Column()
  userId: string;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.categories)
  user: UserEntity;

  //returns array of subCategories. Might be null.
  @Field(() => [SubCategoryEntity], { nullable: true })
  //one category has many subCategoryEntity's.
  //Relates to SubCategoryEntity through subCategory.category property.
  @OneToMany(() => SubCategoryEntity, (subCategory) => subCategory.category, {
    nullable: true,
  })
  subCategories: SubCategoryEntity[];

  @Field(() => [TransactionEntity])
  @OneToMany(() => TransactionEntity, (transaction) => transaction.category)
  transactions: TransactionEntity[];
}
