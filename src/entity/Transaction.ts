import { Entity, Column, BaseEntity, PrimaryColumn, ManyToOne } from "typeorm";
import { ObjectType, Field, Float, Int } from "type-graphql";
import { UserEntity } from "./User";
import { CategoryEntity } from "./Category";
import { SubCategoryEntity } from "./SubCategory";
//import { SubCategoryEntity } from "./SubCategory";

@ObjectType()
@Entity()
export class TransactionEntity extends BaseEntity {
  @Field()
  @PrimaryColumn()
  id: String;

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

  @Field({ nullable: true })
  @Column({ nullable: true })
  subCategoryName: String;

  @Field({ nullable: true })
  @Column({ nullable: true })
  categoryName: String;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  categoryId: number;

  //Transactions get imported with no category assigned yet. So nullable=true.
  @Field(() => CategoryEntity, { nullable: true })
  @ManyToOne(() => CategoryEntity, (category) => category.transactions, {
    nullable: true,
  })
  category: CategoryEntity;

  @Field(() => SubCategoryEntity, { nullable: true })
  @ManyToOne(
    () => SubCategoryEntity,
    (subCategory) => subCategory.transactions,
    {
      nullable: true,
    }
  )
  subCategory: SubCategoryEntity;
}
