export interface TransactionFile {
  transactions: Transaction[];
  errors: string[];
}

export const TransactionStatuses = ['Executed', 'Cancelled', 'Expired', 'Pending', 'Rejected'];
export type TransactionStatus = typeof TransactionStatuses[number];

export const AssetTypes = ['Security', 'Cash'];
export type AssetType = typeof AssetTypes[number];

export const TransactionTypes = ['Buy', 'Sell', 'Distribution', 'Interest', 'Taxes', 'Fee', 'Deposit', 'Withdrawal', 'Corporate action'];
export type TransactionType = typeof TransactionTypes[number];

export interface Transaction {
  readonly raw: string;
  readonly time: Date;
  readonly status: TransactionStatus;
  readonly reference: string;
  readonly description: string;
  readonly assetType: AssetType;
  readonly type: TransactionType;
  readonly isin: string;
  readonly shares: number;
  readonly price: number;
  readonly amount: number;
  readonly fee: number;
  readonly tax: number;
  readonly currency: string;

  // Only used for type === 'Buy'
  sharesSold: number;

  // Only used for type === 'Sell'
  gainOrLoss: number;
}

export interface DataModel {
  file: TransactionFile;
  executedTransactions: Transaction[];
  cryptoIsins: string[];
  isinToTitle: Map<string, string>;
}

export interface SectionRenderer {
  render(dataModel: DataModel): HTMLDivElement;
}
