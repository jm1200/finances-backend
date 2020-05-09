import { Entity, Column, BaseEntity, PrimaryColumn, ManyToOne } from "typeorm";
import { ObjectType, Field, Float, Root } from "type-graphql";
import { UserEntity } from "./User";
import { CategoryEntity } from "./Category";
import { SubCategoryEntity } from "./SubCategory";
import { SavedCategoriesEntity } from "./SavedCategories";

@ObjectType()
@Entity()
export class TransactionEntity extends BaseEntity {
  @Field()
  @PrimaryColumn()
  id: string;

  @Field()
  @Column()
  userId: string;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.transactions)
  user: UserEntity;

  @Field()
  @Column()
  book: string;

  @Field()
  @Column()
  account: string;

  @Field()
  @Column()
  type: string;

  @Field()
  @Column()
  datePosted: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  memo: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  note: string;

  @Field(() => String || null, { nullable: true })
  @Column({ nullable: true, type: "varchar" })
  savedCategoryId: string | null;

  @Field(() => SavedCategoriesEntity, { nullable: true })
  @ManyToOne(
    () => SavedCategoriesEntity,
    (savedCategory) => savedCategory.transactions
  )
  savedCategory: SavedCategoriesEntity;

  @Field()
  keyName(@Root() parent: TransactionEntity): string {
    return parent.name.concat(parent.memo ? parent.memo : "");
  }

  @Field(() => Float)
  @Column({ type: "real" })
  amount: number;

  @Field()
  @Column()
  subCategoryId: string;

  @Field()
  @Column()
  categoryId: string;

  //Transactions get imported with no category assigned yet. So nullable=true.
  @Field(() => CategoryEntity)
  @ManyToOne(() => CategoryEntity, (category) => category.transactions)
  category: CategoryEntity;

  @Field(() => SubCategoryEntity)
  @ManyToOne(() => SubCategoryEntity, (subCategory) => subCategory.transactions)
  subCategory: SubCategoryEntity;
}
