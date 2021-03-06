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
import { UserEntity } from "./User";
import { CategoryEntity } from "./Category";
import { SavedCategoriesEntity } from "./SavedCategories";
import { CategoryTotalsEntity } from "./CategoryTotals";

@ObjectType()
@Entity()
export class SubCategoryEntity extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  //Foreign Key
  @Field()
  @Column()
  categoryId: string;

  //returns one CategoryEntity
  @Field(() => CategoryEntity)
  //Many SubCategories relate to one CategoryEntity.
  //Relates to category entity by being a member inside category.subCategories.
  @ManyToOne(() => CategoryEntity, (category) => category.subCategories)
  category: CategoryEntity;

  //Foreign Key
  @Field()
  @Column()
  userId: string;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.subCategories)
  user: UserEntity;

  @Field(() => [TransactionEntity])
  @OneToMany(() => TransactionEntity, (transaction) => transaction.subCategory)
  transactions: TransactionEntity[];

  @Field(() => [SavedCategoriesEntity])
  @OneToMany(
    () => SavedCategoriesEntity,
    (savedCategory) => savedCategory.subCategory
  )
  savedCategories: SavedCategoriesEntity[];
  @Field(() => [CategoryTotalsEntity])
  @OneToMany(
    () => CategoryTotalsEntity,
    (categoryTotal) => categoryTotal.subCategory
  )
  categoryTotals: CategoryTotalsEntity[];
}
