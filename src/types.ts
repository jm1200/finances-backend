import { ObjectType, Field, InputType, Float } from "type-graphql";
import { Stream } from "stream";
import { Request, Response } from "express";

@ObjectType()
export class TransactionClass {
  @Field()
  id: string;
  @Field()
  userId: string;
  @Field()
  account: string;
  @Field()
  type: string;
  @Field()
  datePosted: string;
  @Field()
  name: string;
  @Field()
  savedCategory: boolean;
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
  type: String;
  @Field()
  datePosted: String;
  @Field()
  name: String;
  @Field()
  categoryId: string;
  @Field()
  subCategoryId: string;
  @Field()
  savedCategory: boolean;
  @Field()
  memo: String;
  @Field(() => Float)
  amount: number;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  subCategoryId: string;
  savedCategory: boolean;
  account: string;
  type: string;
  datePosted: string;
  name: string;
  memo: string;
  amount: number;
}

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
  transactions?: Transaction[];
}

export interface MyContext {
  req: Request;
  res: Response;
  payload?: { userId: string };
}
