import { Transaction, TransactionStatuses, AssetTypes, TransactionTypes, TransactionFile, TransactionStatus, AssetType, TransactionType } from "./interfaces";

function getRowError(transaction: Transaction, row: any): string {
  if (transaction.time.getFullYear() < 2000 || transaction.time.getFullYear() > 2100) {
    return `Invalid year ${transaction.time.getFullYear()} in row ${JSON.stringify(row)}`;
  }
  if (!TransactionStatuses.includes(transaction.status)) {
    return `Invalid status ${transaction.status} in row ${JSON.stringify(row)}`;
  }
  if (!AssetTypes.includes(transaction.assetType)) {
    return `Invalid asset type ${transaction.assetType} in row ${JSON.stringify(row)}`;
  }
  if (!TransactionTypes.includes(transaction.type)) {
    return `Invalid transaction type ${transaction.type} in row ${JSON.stringify(row)}`;
  }
  if (isNaN(transaction.shares)) {
    return `Invalid shares ${row['shares']} in row ${JSON.stringify(row)}`;
  }
  if (isNaN(transaction.price) || transaction.price < 0) {
    return `Invalid price ${row['price']} in row ${JSON.stringify(row)}`;
  }
  if (isNaN(transaction.amount)) {
    return `Invalid amount ${row['amount']} in row ${JSON.stringify(row)}`;
  }
  if (isNaN(transaction.fee) || transaction.fee < 0) {
    return `Invalid fee ${row['fee']} in row ${JSON.stringify(row)}`;
  }
  if (isNaN(transaction.tax) || transaction.tax < 0) {
    return `Invalid tax ${row['tax']} in row ${JSON.stringify(row)}`;
  }
  if (transaction.currency !== 'EUR') {
    return `Expecting only EUR but got ${row['currency']} in row ${JSON.stringify(row)}`;
  }
  // if shares is not 0 and price times shares is diferent from amount by 0.01, error
  const amountExpected = transaction.price * transaction.shares * (transaction.type === 'Buy' ? -1 : 1);
  if (transaction.shares !== 0 && Math.abs(amountExpected - transaction.amount) > 0.01) {
    return `Invalid amount ${row['amount']} - expected ${amountExpected} in row ${JSON.stringify(row)}`;
  }
  return '';
}

export function parseRows(input: string) {
  const rows = input.split('\n');
  const headers = rows[0].split(';');
  rows.shift();

  const result = [];
  for (let rowText of rows) {
    rowText = rowText.trim();
    if (!rowText) continue;
    const values = rowText.split(';');
    if (values.length !== headers.length) throw new Error(`Invalid row: ${rowText}`);
    const row = new Map<string, string>();
    row.set('raw', rowText);
    for (let i = 0; i < headers.length; i++) {
      let value = values[i];
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      row.set(headers[i], value);
    }
    result.push(Object.fromEntries(row));
  }

  return result;
}

export function parseTransactionFile(input: string): TransactionFile {
  const rows = parseRows(input);

  const transactions: Transaction[] = [];
  const errors: string[] = [];
  for (const row of rows) {
    const transaction = {
      raw: row['raw'],
      time: parseTime(row['date'], row['time']),
      status: row['status'] as TransactionStatus,
      reference: row['reference'],
      description: row['description'],
      assetType: row['assetType'] as AssetType,
      type: row['type'] as TransactionType,
      isin: row['isin'],
      shares: parseSCNumber(row['shares']),
      price: parseSCNumber(row['price']),
      amount: parseSCNumber(row['amount']),
      fee: parseSCNumber(row['fee']),
      tax: parseSCNumber(row['tax']),
      currency: row['currency'],
      sharesSold: 0,
      gainOrLoss: 0,
    };
    const error = getRowError(transaction, row);
    if (error) {
      errors.push(error);
      continue;
    }
    transactions.push(transaction);
  };
  transactions.sort((a, b) => a.time.getTime() - b.time.getTime());
  return { transactions, errors };
}

export function parseSCNumber(input: string): number {
  if (!input) return 0;
  return parseFloat(input.replace(/\./, '').replace(/\,/, '.'));
}

export function parseTime(dateYYYYMMDD: string, timeHHMMSS: string): Date {
  const date = new Date(dateYYYYMMDD);
  const time = timeHHMMSS.split(':');
  date.setHours(Number(time[0]), Number(time[1]), Number(time[2]));
  return date;
}
