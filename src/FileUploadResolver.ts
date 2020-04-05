import { Resolver, Mutation, Arg, ObjectType, Field } from "type-graphql";
import { GraphQLUpload } from "apollo-server-express";
const path = require("path");
import { Stream } from "stream";
import { createWriteStream } from "fs";
import { parse } from "ofx-js";
import { parseTransactions } from "./modules/fileUploadResolver/parseTransactions";
import { Transaction } from "./entity/Transaction";
const fs = require("fs");

export interface Upload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
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

    //console.log("TRANSACTIONS: ", transactions);
    //Transaction.insert(transactions.transactions);
    return {
      uploaded: true,
      name: fileName,
      account: transactions.account,
      rangeStart: transactions.rangeStart,
      rangeEnd: transactions.rangeEnd,
      transactions: transactions.transactions,
    };
  }
}
