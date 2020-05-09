import { ObjectType, Field, InputType, Float } from "type-graphql";
import { Stream } from "stream";
import { Request, Response } from "express";
import { TransactionEntity } from "./entity/Transaction";
import Maybe from "graphql/tsutils/Maybe";
import { SavedCategoriesEntity } from "./entity/SavedCategories";
import { CategoryEntity } from "./entity/Category";
import { SubCategoryEntity } from "./entity/SubCategory";

@ObjectType()
export class TransactionClass {
  @Field()
  id: string;
  @Field()
  userId: string;
  @Field()
  book: String;
  @Field()
  account: string;
  @Field()
  type: string;
  @Field()
  datePosted: string;
  @Field()
  name: string;
  @Field({ nullable: true })
  savedCategoryId: string;
  @Field()
  categoryId: string;
  @Field()
  subCategoryId: string;
  @Field()
  memo: string;
  @Field()
  amount: number;
}

@InputType()
export class TransactionInput {
  @Field()
  id: String;
  @Field()
  userId: string;
  @Field()
  account: String;
  @Field()
  book: String;
  @Field()
  type: String;
  @Field()
  datePosted: String;
  @Field()
  name: String;
  @Field()
  categoryId: string;
  @Field()
  subCategoryId: string;
  @Field({ nullable: true })
  savedCategoryId: string;
  @Field()
  memo: String;
  @Field(() => Float)
  amount: number;
}

// export interface Transaction {
//   id: string;
//   userId: string;

//   categoryId: string;
//   subCategoryId: string;
//   savedCategoryId: string | null;
//   account: string;
//   type: string;
//   datePosted: string;
//   name: string;
//   memo: string;
//   amount: number;
// }

export interface Upload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
}

@ObjectType()
export class SubmitTransactionsResponse {
  @Field()
  inserted: boolean;
  @Field()
  message: string;
}

@ObjectType()
export class UploadResponse {
  @Field()
  uploaded: boolean;
  @Field()
  name: string;
  @Field()
  account?: string;
  @Field()
  rangeStart?: string;
  @Field()
  rangeEnd?: string;
  @Field(() => [TransactionClass])
  transactions?: TransactionClass[];
}

export interface MyContext {
  req: Request;
  res: Response;
  payload?: { userId: string };
}

export type RowInput = { __typename?: "TransactionEntity" } & Pick<
  TransactionEntity,
  "id" | "datePosted" | "name" | "memo" | "note" | "amount" | "keyName"
> & {
    savedCategory?: Maybe<
      { __typename?: "SavedCategoriesEntity" } & Pick<
        SavedCategoriesEntity,
        "id" | "name" | "amounts"
      >
    >;
    category?: Maybe<
      { __typename?: "CategoryEntity" } & Pick<CategoryEntity, "id" | "name">
    >;
    subCategory?: Maybe<
      { __typename?: "SubCategoryEntity" } & Pick<
        SubCategoryEntity,
        "id" | "name"
      >
    >;
  };
