import { Transaction } from "../../types";
import { SavedCategoriesEntity } from "../../entity/SavedCategories";
import { CategoryEntity } from "../../entity/Category";
import { SubCategoryEntity } from "../../entity/SubCategory";
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
  trans: [Transaction],
  userId: string
): Promise<TransResponse> {
  let categoryId: string;
  let subCategoryId: string;
  const catRes = await CategoryEntity.findOne({
    where: { userId, name: "uncategorized" },
  });
  const unCategorizedCategoryId = catRes!.id;

  const subCatRes = await SubCategoryEntity.findOne({
    where: { userId, name: "uncategorized" },
  });
  const unCategorizedSubCategoryId = subCatRes!.id;

  //console.log("uncat cats", unCategorizedCategory, unCategorizedSubCategory);

  const categorizedTransactions = await SavedCategoriesEntity.find({
    where: { userId },
  });
  // interface INormalisedCategorizedTransactions {
  //   [key: string]: CategorizedTransactionsEntity;
  // }
  //let normalisedCategorizedTransactions: INormalisedCategorizedTransactions;

  if (categorizedTransactions.length === 0) {
    categoryId = unCategorizedCategoryId;
    subCategoryId = unCategorizedSubCategoryId;
    console.log("inserteing uncat cat ids", categoryId, subCategoryId);
  } else {
    console.log("PT 82: keyname", categorizedTransactions[0].keyName);
    // categorizedTransactions.forEach(categorizedTransaction=>{

    // })
  }

  let transactions: Transaction[] = trans.map((transObj: any) => {
    return {
      id: transObj.FITID,
      userId,
      account,
      categoryId,
      subCategoryId,
      type: transObj.TRNTYPE,
      savedCategory: false,
      datePosted: formatDate(transObj.DTPOSTED),
      name: transObj.NAME ? transObj.NAME : "",
      memo: transObj.MEMO,
      amount: parseFloat(transObj.TRNAMT),
    };
  });

  console.log("PT 104: ", transactions[0]);
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
