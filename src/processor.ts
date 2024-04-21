import { DataModel, Transaction, TransactionFile } from "./interfaces";

export function prepareDataModel(file: TransactionFile): DataModel {
  const executedTransactions = file.transactions.filter(t => t.status === 'Executed').sort((a, b) => a.time.getTime() - b.time.getTime());
  processSales(executedTransactions);

  const isinToTitle = new Map<string, string>();
  for (const transaction of executedTransactions) {
    if (transaction.isin && transaction.description) isinToTitle.set(transaction.isin, transaction.description);
  }

  return { cryptoIsins: [], isinToTitle, file, executedTransactions };
}

function processSales(transactions: Transaction[]) {
  const sales = transactions.filter(t => t.type === 'Sell');
  for (const sale of sales) {
    const buys = transactions.filter(t => t.type === 'Buy' && t.isin === sale.isin && t.shares > t.sharesSold);
    let remainingShares = sale.shares;
    let buyAmount = 0;
    for (const buy of buys) {
      const sharesToSell = Math.min(buy.shares - buy.sharesSold, remainingShares);
      buy.sharesSold += sharesToSell;
      buyAmount += sharesToSell * buy.price;
      remainingShares -= sharesToSell;
      if (remainingShares === 0) {
        break;
      }
    }
    if (remainingShares > 0) throw new Error(`Not enough shares to sell for ${sale.reference}`);
    sale.gainOrLoss = sale.amount - buyAmount - sale.fee - sale.tax;
  }
}

export function getRemainingShares(transactions: Transaction[]) {
  let remainingShares = 0;
  for (const transaction of transactions) {
    if (transaction.type === 'Buy') {
      remainingShares += transaction.shares;
    } else if (transaction.type === 'Sell') {
      remainingShares -= transaction.shares;
    }
  }
  return remainingShares;
}

export function isNumericHeader(header: string): boolean {
  return ['Shares', 'Price', 'Amount', 'Fee', 'Tax', 'Gain/Loss'].includes(header);
}
