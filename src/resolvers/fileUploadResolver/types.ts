import { ObjectType, Field, InputType, Float } from "type-graphql";
import { Stream } from "stream";
import { TransactionEntity } from "../../entity/Transaction";

export interface Upload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
}
@InputType()
export class TransactionInput {
  @Field()
  transId: String;
  @Field()
  account: String;
  @Field()
  type: String;
  @Field()
  datePosted: String;
  @Field()
  name: String;
  @Field()
  memo: String;
  @Field(() => Float)
  amount: number;
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
  @Field(() => [TransactionEntity])
  transactions?: TransactionEntity[];
}
@ObjectType()
export class SubmitTransactionsResponse {
  @Field()
  inserted: boolean;
  @Field()
  message: string;
}
