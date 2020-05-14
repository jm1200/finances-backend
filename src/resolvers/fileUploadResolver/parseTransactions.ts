import { TransactionClass } from "../../types";
import numeral from "numeral";
// var util = require("util");
// import fs from "fs";
import { SavedCategoriesEntity } from "../../entity/SavedCategories";
import {
  getKnownCategories,
  getNormalizedCategories,
} from "./getKnownCategories";
//import { v4 as uuid } from "uuid";

export class TransResponse {
  account: string;
  rangeStart: string;
  rangeEnd: string;
  transactions: TransactionClass[];
}
export const parseTransactions = (
  parsedData: any,
  userId: string,
  book: string
) => {
  //get account type
  let account: string;
  if (parsedData.OFX.BANKMSGSRSV1) {
    account = "Bank";
  } else if (parsedData.OFX.CREDITCARDMSGSRSV1) {
    account = "Creditcard";
  } else {
    throw new Error("Could not parse account");
    return { uploaded: false };
  }

  let transactions: any;
  if (account === "Bank") {
    const data = parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST;
    transactions = parseTransObj(
      account,
      data.DTSTART,
      data.DTEND,
      data.STMTTRN,
      userId,
      book
    );
  } else if (account === "Creditcard") {
    const data =
      parsedData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST;
    transactions = parseTransObj(
      account,
      data.DTSTART,
      data.DTEND,
      data.STMTTRN,
      userId,
      book
    );
  }
  return transactions;
};

async function parseTransObj(
  account: string,
  start: string,
  end: string,
  trans: any,
  userId: string,
  book: string
): Promise<TransResponse> {
  let categoryId: string;
  let subCategoryId: string;
  let savedCategoryId: string | null = null;

  //gives shape:
  //"categoryId": {id: string;
  //              name: string;
  //              subCategories: {
  //                  "subCategoryId": SubCategoryEntity
  //              }}
  const normalizedCategories = await getNormalizedCategories();

  //gives shape:
  //"categoryName": { categoryId: string; subCategoryId: string }
  const KNOWN_CATEGORIES_MAP = await getKnownCategories();

  //returns the known category name if it is known.
  const inKnownCategories = (name: string): string => {
    let knownCategory: string = "";
    for (let i = 0; i < Object.keys(KNOWN_CATEGORIES_MAP).length; i++) {
      if (name.toLowerCase().includes(Object.keys(KNOWN_CATEGORIES_MAP)[i])) {
        knownCategory = Object.keys(KNOWN_CATEGORIES_MAP)[i];
        break;
      }
    }
    return knownCategory;
  };

  // Create saved categories
  for (let i = 0; i < trans.length; i++) {
    //if a name exists AND that name is a known category, create a saved category
    // if one doesn't exist already.
    if (trans[i].NAME && inKnownCategories(trans[i].NAME)) {
      const savedCategoryResponse = await SavedCategoriesEntity.findOne({
        where: { name: trans[i].NAME, memo: trans[i].MEMO, book },
      });
      if (!savedCategoryResponse) {
        let categoryId =
          KNOWN_CATEGORIES_MAP[inKnownCategories(trans[i].NAME)].categoryId;
        let subCategoryId =
          KNOWN_CATEGORIES_MAP[inKnownCategories(trans[i].NAME)].subCategoryId;
        await SavedCategoriesEntity.create({
          name: trans[i].NAME,
          memo: trans[i].MEMO,
          book,
          userId,
          categoryId,
          subCategoryId,
          amounts: [],
        }).save();
      }
    }
  }

  let transactions: TransactionClass[] = await Promise.all(
    trans.map(async (transObj: any) => {
      const res = await SavedCategoriesEntity.findOne({
        where: {
          name: transObj.NAME,
          memo: transObj.MEMO,
          book,
        },
      });
      if (res) {
        //the correct category already exists
        categoryId = res.categoryId;
        subCategoryId = res.subCategoryId;
        savedCategoryId = res.id;
      } else {
        categoryId = normalizedCategories["uncategorized"].id;
        subCategoryId =
          normalizedCategories["uncategorized"].subCategories["uncategorized"]
            .id;
        savedCategoryId = null;
      }

      return {
        id: transObj.FITID,
        userId,
        book,
        account,
        categoryId,
        subCategoryId,
        type: transObj.TRNTYPE,
        savedCategoryId,
        datePosted: formatDate(transObj.DTPOSTED),
        name: transObj.NAME ? transObj.NAME : "",
        memo: transObj.MEMO,
        amount: parseFloat(numeral(transObj.TRNAMT).format("0.00")),
      };
    })
  );

  // fs.writeFileSync(
  //   "./test.txt",
  //   util.inspect(await transactions, { showHidden: true, depth: null })
  // );
  return {
    account,
    rangeStart: `${formatDate(start)}`,
    rangeEnd: `${formatDate(end)}`,
    transactions: await transactions,
  };
}

const formatDate = (date: String) => {
  //console.log("date test");
  //const dateFromFile = date.split("").slice(0, 8).join("");
  //console.log("Date from file: ", dateFromFile);
  const timestamp = date.split("").slice(0, 8).join("");

  //console.log("timestamp??", timestamp);
  // console.log(
  //   "format timestamp: ",
  //   moment(parseInt(timestamp)).format("YYYY-MM-DD")
  // );
  return timestamp;
};
