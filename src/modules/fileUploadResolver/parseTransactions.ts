//import moment from "moment";

export class Transaction {
  account: string;
  type: string;
  datePosted: string;
  transId: string;
  name: string;
  memo: string;
  amount: number;
}
export class TransResponse {
  account: string;
  rangeStart: string;
  rangeEnd: string;
  transactions: Transaction[];
}
export const parseTransactions = (parsedData: any) => {
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
      data.STMTTRN
    );
  } else if (account === "Creditcard") {
    const data =
      parsedData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST;
    transactions = parseTransObj(
      account,
      data.DTSTART,
      data.DTEND,
      data.STMTTRN
    );
  }
  return transactions;
};

function parseTransObj(
  account: string,
  start: string,
  end: string,
  trans: [Transaction]
): TransResponse {
  let transactions = trans.map((transObj: any) => ({
    account,
    type: transObj.TRNTYPE,
    datePosted: formatDate(transObj.DTPOSTED),
    transId: transObj.FITID,
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
