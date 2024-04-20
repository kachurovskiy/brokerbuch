import { Transaction } from "./parser";

export function processSales(transactions: Transaction[]) {
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
  return sales;
}

export function groupTransactions(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const key = getGroupKey(transaction);
    const group = groups.get(key) || [];
    group.push(transaction);
    groups.set(key, group);
  }
  return groups;
}

export function getGroupKey(transaction: Transaction): string {
  if (transaction.isin) return transaction.isin;
  if (transaction.type === 'Deposit' || transaction.type === 'Withdrawal') return 'Deposit/Withdrawal';
  return transaction.type;
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
