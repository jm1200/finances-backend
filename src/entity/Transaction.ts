import { Entity, Column, BaseEntity, PrimaryColumn, ManyToOne } from "typeorm";
import { ObjectType, Field, Float, Root } from "type-graphql";
import { UserEntity } from "./User";
import { CategoryEntity } from "./Category";
import { SubCategoryEntity } from "./SubCategory";

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

  @Field()
  keyName(@Root() parent: TransactionEntity): string {
    return parent.name
      .concat(parent.memo ? parent.memo : "")
      .concat(parent.note ? parent.note : "");
  }

  @Field(() => Float)
  @Column({ type: "real" })
  amount: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subCategoryId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  categoryId: string;

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
