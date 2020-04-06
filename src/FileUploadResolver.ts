import {
  Resolver,
  Mutation,
  Arg,
  ObjectType,
  Field,
  InputType,
  Float,
  Ctx,
} from "type-graphql";
import { GraphQLUpload } from "apollo-server-express";
const path = require("path");
import { Stream } from "stream";
import { createWriteStream } from "fs";
import { parse } from "ofx-js";
import { parseTransactions } from "./modules/fileUploadResolver/parseTransactions";
import { Transaction } from "./entity/Transaction";
import { MyContext } from "./MyContext";
const fs = require("fs");

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
class UploadResponse {
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
  @Field(() => [Transaction])
  transactions?: Transaction[];
}
@ObjectType()
class SubmitTransactionsResponse {
  @Field()
  inserted: boolean;
  @Field()
  message: string;
}

@Resolver()
export class FileUploadResolver {
  @Mutation(() => UploadResponse)
  async uploadFile(
    @Arg("file", () => GraphQLUpload!) file: Upload
  ): Promise<UploadResponse> {
    const fileName = file.filename;
    const filepath: string = path.join(__dirname, "../tempFiles", fileName);
    await new Promise((resolve) => {
      file
        .createReadStream()
        .pipe(createWriteStream(filepath))
        .on("close", resolve);
    });

    console.log("file written");
    const data = fs.readFileSync(filepath, { encoding: "utf8" });
    if (!data) {
      throw new Error("Could not read file");
    }

    const parsedData = await parse(data);
    if (!parsedData) {
      throw new Error("could not parse file");
    }

    let transactions = parseTransactions(parsedData);

    try {
      fs.unlinkSync(filepath);
    } catch (err) {
      console.log("could not delete file", err);
    }

    return {
      uploaded: true,
      name: fileName,
      account: transactions.account,
      rangeStart: transactions.rangeStart,
      rangeEnd: transactions.rangeEnd,
      transactions: transactions.transactions,
    };
  }

  @Mutation(() => SubmitTransactionsResponse)
  async submitTransactions(
    @Arg("transactions", () => [TransactionInput]) transactions: Transaction[]
  ): Promise<SubmitTransactionsResponse> {
    console.log("TRANSACTIONS: ", transactions);
    try {
      await Transaction.insert(transactions);
      return { inserted: true, message: "Inserted transactions successfully" };
    } catch (err) {
      //res.send("Duplicate values");
      return { inserted: false, message: "failed to insert transactions" };
    }
  }
}
