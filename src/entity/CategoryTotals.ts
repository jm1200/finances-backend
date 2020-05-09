import { Entity, Column, BaseEntity, PrimaryColumn, ManyToOne } from "typeorm";
import { ObjectType, Field, Float } from "type-graphql";
import { UserEntity } from "./User";
import { CategoryEntity } from "./Category";
import { SubCategoryEntity } from "./SubCategory";

@ObjectType()
@Entity()
export class CategoryTotalsEntity extends BaseEntity {
  @Field()
  @PrimaryColumn()
  id: string;

  @Field()
  @Column()
  userId: string;

  @Field()
  @Column("timestamp with time zone")
  lastUpdate: Date;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.transactions)
  user: UserEntity;

  @Field()
  @Column()
  month: string;

  @Field()
  @Column()
  year: string;

  @Field(() => Float)
  @Column({ type: "real" })
  total: number;

  //category totals row do not have a subCategoryId. can be null
  @Field({ nullable: true })
  @Column({ nullable: true })
  subCategoryId: string;

  @Field()
  @Column()
  categoryId: string;

  @Field(() => CategoryEntity)
  @ManyToOne(() => CategoryEntity, (category) => category.categoryTotals)
  category: CategoryEntity;

  @Field(() => SubCategoryEntity, { nullable: true })
  @ManyToOne(
    () => SubCategoryEntity,
    (subCategory) => subCategory.categoryTotals
  )
  subCategory: SubCategoryEntity | null;
}
