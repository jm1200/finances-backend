import { Transaction } from "../../types";
import numeral from "numeral";
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
  transactions: Transaction[];
}
export const parseTransactions = (parsedData: any, userId: string) => {
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
      userId
    );
  } else if (account === "Creditcard") {
    const data =
      parsedData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST;
    transactions = parseTransObj(
      account,
      data.DTSTART,
      data.DTEND,
      data.STMTTRN,
      userId
    );
  }
  return transactions;
};

async function parseTransObj(
  account: string,
  start: string,
  end: string,
  trans: any,
  userId: string
): Promise<TransResponse> {
  let categoryId: string;
  let subCategoryId: string;
  let savedCategoryId: string | null = null;

  const normalizedCategories = await getNormalizedCategories();
  const KNOWN_CATEGORIES_MAP = await getKnownCategories();

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

  //Create saved categories
  for (let i = 0; i < trans.length; i++) {
    //if a name exists AND that name is a known category, create a saved category
    // if one doesn't exist already.
    if (trans[i].NAME && inKnownCategories(trans[i].NAME)) {
      const savedCategoryResponse = await SavedCategoriesEntity.findOne({
        where: { name: trans[i].NAME, memo: trans[i].MEMO },
      });
      if (!savedCategoryResponse) {
        let categoryId =
          KNOWN_CATEGORIES_MAP[inKnownCategories(trans[i].NAME)].categoryId;
        let subCategoryId =
          KNOWN_CATEGORIES_MAP[inKnownCategories(trans[i].NAME)].subCategoryId;
        await SavedCategoriesEntity.create({
          name: trans[i].NAME,
          memo: trans[i].MEMO,
          userId,
          categoryId,
          subCategoryId,
          amounts: [],
        }).save();
      }
    }
  }

  let transactions: Transaction[] = await Promise.all(
    trans.map(async (transObj: any) => {
      const res = await SavedCategoriesEntity.find({
        where: { name: transObj.NAME, memo: transObj.MEMO },
      });

      if (res.length > 1) {
        //check amounts to compare
        res.forEach((cat) => {
          if (cat.amounts.includes(parseFloat(transObj.TRNAMT))) {
            categoryId = cat.categoryId;
            subCategoryId = cat.subCategoryId;
            savedCategoryId = cat.id;
          }
        });
      } else if (res.length === 1) {
        //the correct category already exists
        categoryId = res[0].categoryId;
        subCategoryId = res[0].subCategoryId;
        savedCategoryId = res[0].id;
      } else {
        categoryId = normalizedCategories["uncategorized"].id;
        subCategoryId =
          normalizedCategories["uncategorized"].subCategories["uncategorized"]
            .id;
        // }
      }

      return {
        id: transObj.FITID,
        userId,
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

  return {
    account,
    rangeStart: `${formatDate(start)}`,
    rangeEnd: `${formatDate(end)}`,
    transactions,
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
