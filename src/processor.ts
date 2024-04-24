import { DataModel, Transaction, TransactionFile } from "./interfaces";

const CRYPTO_ISINS = [
  'GB00BLD4ZL17', // CoinShares Physical Bitcoin
  'GB00BNRRF105', // CoinShares Physical Staked Algorand
  'GB00BNRRB013', // CoinShares Physical Staked Matic
  'GB00BNRRFW10', // CoinShares Physical Staked Polkadot
  'GB00BLD4ZN31', // CoinShares Physical XRP
  'DE000A3GVKY4', // ETC Group Physical Cardano
  'DE000A3GVKZ1', // ETC Group Physical Solana
];

export function prepareDataModel(file: TransactionFile): DataModel {
  const executedTransactions = file.transactions.filter(t => t.status === 'Executed').sort((a, b) => a.time.getTime() - b.time.getTime());
  processSales(executedTransactions);

  const isinToTitle = new Map<string, string>();
  for (const transaction of executedTransactions) {
    if (transaction.isin && transaction.description) isinToTitle.set(transaction.isin, transaction.description);
  }

  return { cryptoIsins: CRYPTO_ISINS, isinToTitle, file, executedTransactions };
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
      buyAmount += sharesToSell * buy.price + (buy.sharesSold === buy.shares ? buy.fee : 0);
      remainingShares -= sharesToSell;
      if (remainingShares === 0) {
        break;
      }
    }
    if (remainingShares > 0) throw new Error(`Not enough shares to sell for ${sale.reference}`);
    sale.gainOrLoss = sale.amount - buyAmount - sale.fee;
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
