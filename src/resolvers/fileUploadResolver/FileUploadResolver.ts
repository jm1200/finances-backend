import { Resolver, Mutation, Arg } from "type-graphql";
import { GraphQLUpload } from "apollo-server-express";
const path = require("path");
import { createWriteStream } from "fs";
import { parse } from "ofx-js";
import { parseTransactions } from "./parseTransactions";
import { TransactionEntity } from "../../entity/Transaction";
import {
  UploadResponse,
  Upload,
  SubmitTransactionsResponse,
  TransactionInput,
} from "./types";
const fs = require("fs");

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
    @Arg("transactions", () => [TransactionInput])
    transactions: TransactionEntity[]
  ): Promise<SubmitTransactionsResponse> {
    console.log("TRANSACTIONS: ", transactions);
    try {
      await TransactionEntity.insert(transactions);
      return { inserted: true, message: "Inserted transactions successfully" };
    } catch (err) {
      //res.send("Duplicate values");
      return { inserted: false, message: "failed to insert transactions" };
    }
  }
}
