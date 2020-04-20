import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";
import { TransactionEntity } from "./Transaction";
import { UserSettingsEntity } from "./UserSettings";
import { CategoryEntity } from "./Category";
import { SubCategoryEntity } from "./SubCategory";

@ObjectType()
@Entity()
export class UserEntity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column("int", { default: 0 })
  tokenVersion: number;

  @Field(() => Int)
  @Column()
  userSettingsId: number;

  @Field(() => UserSettingsEntity)
  @OneToOne(() => UserSettingsEntity)
  @JoinColumn()
  userSettings: UserSettingsEntity;

  @Field(() => [TransactionEntity])
  @OneToMany(() => TransactionEntity, (transaction) => transaction.user)
  transactions: TransactionEntity[];

  @Field(() => [CategoryEntity])
  @OneToMany(() => CategoryEntity, (category) => category.user)
  categories: CategoryEntity[];

  @Field(() => [SubCategoryEntity])
  @OneToMany(() => SubCategoryEntity, (subCategory) => subCategory.user)
  subCategories: SubCategoryEntity[];
}
