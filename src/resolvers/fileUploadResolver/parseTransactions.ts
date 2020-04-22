import { Transaction } from "../../types";
import { v4 as uuid } from "uuid";

export class TransResponse {
  account: string;
  rangeStart: string;
  rangeEnd: string;
  transactions: Transaction[];
}
export const parseTransactions = (parsedData: any, userId: number) => {
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

function parseTransObj(
  account: string,
  start: string,
  end: string,
  trans: [Transaction],
  userId: number
): TransResponse {
  let transactions: Transaction[] = trans.map((transObj: any) => ({
    id: transObj.FITID,
    userId,
    account,
    type: transObj.TRNTYPE,
    datePosted: formatDate(transObj.DTPOSTED),
    name: transObj.NAME ? transObj.NAME : "",
    memo: transObj.MEMO,
    amount: parseFloat(transObj.TRNAMT),
  }));

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
