// import { ObjectType, Field, Int } from "type-graphql";
// import {
//   Entity,
//   BaseEntity,
//   PrimaryGeneratedColumn,
//   Column,
//   OneToMany,
//   ManyToOne,
// } from "typeorm";

// import { TransactionEntity } from "./Transaction";
// import { UserEntity } from "./User";
// import { CategoryEntity } from "./Category";

// @ObjectType()
// @Entity()
// export class SubCategoryEntity extends BaseEntity {
//   @Field(() => Int!)
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Field()
//   @Column()
//   name: string;

//   //There could be a category but no transactions. so nullable=true
//   //@Field(() => [TransactionEntity])
//   @OneToMany(() => TransactionEntity, (transaction) => transaction.subCategory)
//   transactions: TransactionEntity[];

//   @Field(() => Int)
//   @Column()
//   categoryId: number;

//   @Field(() => CategoryEntity)
//   @ManyToOne(() => CategoryEntity, (category) => category.subCategories)
//   category: CategoryEntity;

// //   @Field(() => Int)
// //   @Column()
// //   userId: number;

// //   @Field(() => UserEntity)
// //   @ManyToOne(() => UserEntity, (user) => user.subCategories)
// //   user: UserEntity;
// }
