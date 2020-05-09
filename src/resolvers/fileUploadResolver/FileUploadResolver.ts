import { Resolver, Mutation, Arg, Ctx } from "type-graphql";
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
} from "../../types";
import { MyContext } from "../../MyContext";
import { verify } from "jsonwebtoken";
const fs = require("fs");

@Resolver()
export class FileUploadResolver {
  @Mutation(() => UploadResponse)
  async uploadFile(
    @Arg("file", () => GraphQLUpload!) file: Upload,
    @Arg("book") book: string,
    @Ctx() context: MyContext
  ): Promise<UploadResponse> {
    const authorization = context.req.headers["authorization"];

    //if the user did not pass in authorization inside the header, then deny access
    let userId;
    try {
      const token = authorization!.split(" ")[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      userId = payload.userId;
    } catch (err) {
      console.log(err);
    }

    const fileName = file.filename;
    const filepath: string = path.join(__dirname, "../tempFiles", fileName);
    await new Promise((resolve) => {
      file
        .createReadStream()
        .pipe(createWriteStream(filepath))
        .on("close", resolve);
    });

    const data = fs.readFileSync(filepath, { encoding: "utf8" });
    if (!data) {
      throw new Error("Could not read file");
    }

    const parsedData = await parse(data);
    if (!parsedData) {
      throw new Error("could not parse file");
    }
    //console.log("Parsed Data: ", parsedData);

    let transactions = await parseTransactions(parsedData, userId, book);
    console.log("FUR59", transactions.transactions[0]);

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
    let duplicatedKeys: string[] = [];

    for (let index in transactions) {
      try {
        await TransactionEntity.insert(transactions[index]);
      } catch (err) {
        duplicatedKeys.push(transactions[index].id);
        console.log(
          `Duplicate entry found: ${transactions[index].name} on ${transactions[index].datePosted}`
        );
      }
    }

    if (duplicatedKeys.length > 0) {
      return {
        inserted: false,
        message: `Found (${duplicatedKeys.length}) duplicate entries, but inserted the rest. `,
      };
    } else {
      return { inserted: true, message: "inserted successfully" };
    }
  }
}
