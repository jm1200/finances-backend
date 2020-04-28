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
  let savedCategoryId: string | null = null;
  const catRes = await CategoryEntity.findOne({
    where: { userId, name: "uncategorized" },
  });
  const unCategorizedCategoryId = catRes!.id;

  const subCatRes = await SubCategoryEntity.findOne({
    where: { userId, name: "uncategorized" },
  });
  const unCategorizedSubCategoryId = subCatRes!.id;

  const categorizedTransactions = await SavedCategoriesEntity.find({
    where: { userId },
  });
  interface ISavedCategoriesMap {
    [key: string]: SavedCategoriesEntity;
  }

  let savedCategoriesMap: ISavedCategoriesMap = {};
  categorizedTransactions.forEach((savedCategory) => {
    savedCategoriesMap[savedCategory.keyName(savedCategory)] = savedCategory;
  });

  console.log("PT 72", categorizedTransactions);

  let transactions: Transaction[] = trans.map((transObj: any) => {
    console.log("pt 84 transobj", transObj);
    if (
      transObj.NAME &&
      Object.keys(savedCategoriesMap).includes(
        transObj.NAME.concat(transObj.MEMO)
      )
    ) {
      categoryId =
        savedCategoriesMap[transObj.NAME.concat(transObj.MEMO)].categoryId;
      subCategoryId =
        savedCategoriesMap[transObj.NAME.concat(transObj.MEMO)].subCategoryId;
      console.log(
        "Found a saved category! ",
        savedCategoriesMap[transObj.NAME.concat(transObj.MEMO)]
      );
    } else {
      categoryId = unCategorizedCategoryId;
      subCategoryId = unCategorizedSubCategoryId;
      console.log("inserteing uncat cat ids", categoryId, subCategoryId);
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
