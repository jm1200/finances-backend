import { ObjectType, Field, Root, Float } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";

import { SubCategoryEntity } from "./SubCategory";
import { CategoryEntity } from "./Category";
import { TransactionEntity } from "./Transaction";

@ObjectType()
@Entity()
export class SavedCategoriesEntity extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  memo: string;

  @Field(() => [Float])
  @Column({ type: "real", array: true })
  amounts: number[];

  @Field()
  keyName(@Root() parent: SavedCategoriesEntity): string {
    return parent.name.concat(parent.memo);
  }

  @Field()
  @Column()
  userId: string;

  //   @Field(() => UserEntity)
  //   @OneToOne(() => UserEntity)
  //   @JoinColumn()
  //   user: UserEntity;

  @Field()
  @Column()
  categoryId: string;

  @Field(() => CategoryEntity)
  @ManyToOne(() => CategoryEntity)
  @JoinColumn()
  category: CategoryEntity;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subCategoryId: string;

  @Field(() => SubCategoryEntity, { nullable: true })
  @ManyToOne(() => SubCategoryEntity, { nullable: true })
  @JoinColumn()
  subCategory: SubCategoryEntity;

  @Field(() => [TransactionEntity])
  @OneToMany(
    () => TransactionEntity,
    (transaction) => transaction.savedCategory
  )
  transactions: TransactionEntity[];
}
