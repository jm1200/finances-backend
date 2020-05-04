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

  //Get users uncategorized category ids
  let subCategoryId: string;
  let savedCategoryId: string | null = null;
  const catRes = await CategoryEntity.findOne({
    where: { userId, name: "uncategorized" },
  });
  categoryId = catRes!.id;

  const subCatRes = await SubCategoryEntity.findOne({
    where: { userId, name: "uncategorized" },
  });
  subCategoryId = subCatRes!.id;

  //normalize savedCategories

  //Find savedCategories

  let transactions: Transaction[] = await Promise.all(
    trans.map(async (transObj: any) => {
      const res = await SavedCategoriesEntity.find({
        where: { name: transObj.NAME, memo: transObj.MEMO },
      });

      if (res.length > 1) {
        res.forEach((cat) => {
          if (cat.amounts.includes(parseFloat(transObj.TRNAMT))) {
            categoryId = cat.categoryId;
            subCategoryId = cat.subCategoryId;
            savedCategoryId = cat.id;
          }
        });
      } else if (res.length === 1) {
        categoryId = res[0].categoryId;
        subCategoryId = res[0].subCategoryId;
        savedCategoryId = res[0].id;
      } else {
        categoryId = catRes!.id;
        subCategoryId = subCatRes!.id;
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
