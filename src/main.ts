import { Transaction, TransactionFile, parseCsv } from './parser';
import { getRemainingShares, groupTransactions, processSales } from './processor';
import './style.css'

// Listen for change events and load file text from input element with type=file and id=transactionInput
const inputElement = document.getElementById('transactionInput') as HTMLInputElement;
inputElement.addEventListener('change', readFile);
function readFile() {
  const files = inputElement.files;
  if (!files) return;
  const file = files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result as string;
    renderTransactionFile(parseCsv(text));
  };
  reader.onerror = (e) => {
    alert(`Error reading file: ${e}`);
  }
  reader.readAsText(file);
}
readFile();

const isinToTitle = new Map<string, string>();

function renderTransactionFile(file: TransactionFile) {
  const outputElement = document.getElementById('transactionOutput')!;

  for (const error of file.errors) {
    const errorElement = document.createElement('div');
    errorElement.innerText = error;
    errorElement.classList.add('error');
    outputElement.appendChild(errorElement);
  }
  const executedTransactions = file.transactions.filter(t => t.status === 'Executed').sort((a, b) => a.time.getTime() - b.time.getTime());
  for (const transaction of executedTransactions) {
    if (transaction.isin && transaction.description) isinToTitle.set(transaction.isin, transaction.description);
  }
  processSales(executedTransactions);

  outputElement.appendChild(renderYearsSection(executedTransactions));

  // Show each group of transactions.
  const groups = groupTransactions(executedTransactions);
  let firstIsinEl = null;
  for (const group of groups) {
    const transactions = group[1];
    const el = renderGroup(transactions);
    if (transactions[0].isin || !firstIsinEl) {
      outputElement.appendChild(el);
      firstIsinEl = el;
    } else {
      outputElement.insertBefore(el, firstIsinEl);
    }
  }
}

function renderYearsSection(transactions: Transaction[]): HTMLDivElement {
  const result = document.createElement('div');

  const titleElement = document.createElement('h2');
  titleElement.innerText = 'Realized gain / loss per year';
  result.appendChild(titleElement);

  const years = transactions.map(t => t.time.getUTCFullYear());
  const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b);
  for (const year of uniqueYears) {
    const yearTransactions = transactions.filter(t => t.time.getUTCFullYear() === year && t.gainOrLoss !== 0);
    if (yearTransactions.length === 0) continue;
    result.appendChild(renderYearSection(year, yearTransactions));
  }

  return result;
}

function renderYearSection(year: number, transactions: Transaction[]): HTMLDivElement {
  const result = document.createElement('div');

  const titleElement = document.createElement('h3');
  titleElement.innerText = 'Calendar year ' + year;
  result.appendChild(titleElement);

  const securityTable = document.createElement('table');
  securityTable.classList.add('yearSecurityTable');
  result.appendChild(securityTable);

  const securityThead = document.createElement('thead');
  securityTable.appendChild(securityThead);
  const securityHeaderRow = document.createElement('tr');
  securityThead.appendChild(securityHeaderRow);
  const securityHeaders = ['Security', 'Gain/Loss'];
  for (const header of securityHeaders) {
    const th = document.createElement('th');
    th.innerText = header;
    if (isNumericHeader(header)) th.classList.add('numeric');
    securityHeaderRow.appendChild(th);
  }

  const securityMap = new Map<string, number>();
  for (const transaction of transactions) {
    const key = transaction.isin;
    const gainLoss = securityMap.get(key) || 0;
    securityMap.set(key, gainLoss + transaction.gainOrLoss);
  }

  for (const [security, gainLoss] of securityMap) {
    const row = document.createElement('tr');
    securityTable.appendChild(row);
    const securityCell = document.createElement('td');
    const securityLink = document.createElement('a');
    securityLink.innerText = isinToTitle.get(security) || security;
    securityLink.href = '#' + security;
    securityCell.appendChild(securityLink);
    row.appendChild(securityCell);
    const gainLossCell = document.createElement('td');
    gainLossCell.innerText = gainLoss.toFixed(2);
    gainLossCell.classList.add(gainLoss > 0 ? 'positive' : 'negative');
    row.appendChild(gainLossCell);
  }

  // Sort all rows in securityTable by first cell (security name) asc.
  const rows = Array.from(securityTable.rows).slice(1);
  rows.sort((a, b) => a.cells[0].innerText.localeCompare(b.cells[0].innerText));
  for (const row of rows) {
    securityTable.appendChild(row);
  }

  // Total gain/loss for the year
  const totalRow = document.createElement('tr');
  totalRow.classList.add('totalRow');
  securityTable.appendChild(totalRow);
  const totalCell = document.createElement('td');
  totalCell.innerText = 'Total';
  totalRow.appendChild(totalCell);
  const totalGainLoss = document.createElement('td');
  const gainLossSum = transactions.reduce((total, t) => total + t.gainOrLoss, 0);
  totalGainLoss.innerText = gainLossSum.toFixed(2);
  totalGainLoss.classList.add(gainLossSum > 0 ? 'positive' : 'negative');
  totalRow.appendChild(totalGainLoss);

  return result;
}

function isNumericHeader(header: string): boolean {
  return ['Shares', 'Price', 'Amount', 'Fee', 'Tax', 'Gain/Loss'].includes(header);
}

function renderGroup(transactions: Transaction[]): HTMLDivElement {
  const result = document.createElement('div');
  result.classList.add('transactionGroup');
  if (transactions.length === 0) return result;
  transactions.sort((a, b) => a.time.getTime() - b.time.getTime());
  const firstTransaction = transactions[0];
  const title = firstTransaction.isin ? firstTransaction.description : firstTransaction.type;

  // Header
  const titleElement = document.createElement('h2');
  titleElement.innerText = title;
  titleElement.id = firstTransaction.isin;
  result.appendChild(titleElement);

  // ISIN
  if (firstTransaction.isin) {
    const isinElement = document.createElement('h3');
    isinElement.innerText = `ISIN: ${firstTransaction.isin}`;
    result.appendChild(isinElement);
  }

  const table = document.createElement('table');
  const tableScroller = document.createElement('div');
  tableScroller.classList.add('tableScroller');
  tableScroller.appendChild(table);
  result.appendChild(tableScroller);

  // Table header.
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const headers = ['Time', 'Type', 'Shares', 'Price', 'Amount', 'Fee', 'Tax', 'Gain/Loss'];
  for (const header of headers) {
    const th = document.createElement('th');
    th.innerText = header;
    if (isNumericHeader(header)) th.classList.add('numeric');
    headerRow.appendChild(th);
  }

  // Transactions for this group.
  for (const transaction of transactions) {
    const row = document.createElement('tr');
    table.appendChild(row);
    const cells = [
      transaction.time.toISOString().split('T')[0],
      transaction.type,
      transaction.shares,
      transaction.price,
      transaction.amount,
      transaction.fee,
      transaction.tax,
      transaction.gainOrLoss,
    ];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const td = document.createElement('td');
      if (cell === 0) {
        td.innerText = '';
      } else if (typeof cell === 'number') {
        td.innerText = cell.toFixed(2);
        td.classList.add('numeric');
        if (['Amount', 'Gain/Loss'].includes(headers[i])) td.classList.add(cell > 0 ? 'positive' : 'negative');
      } else {
        td.innerText = String(cell);
      }
      row.appendChild(td);
    }
  }

  // Remaining shares and sum of amounts
  const totalRow = document.createElement('tr');
  totalRow.classList.add('totalRow');
  table.appendChild(totalRow);
  const totalCell = document.createElement('td');
  totalCell.innerText = 'Total';
  totalRow.appendChild(totalCell);
  totalRow.appendChild(document.createElement('td')); // Type
  const remainingShares = document.createElement('td');
  const sharesSum = getRemainingShares(transactions);
  if (sharesSum) {
    remainingShares.innerText = sharesSum.toFixed(2);
  }
  totalRow.appendChild(remainingShares);
  totalRow.appendChild(document.createElement('td')); // Price

  const totalAmount = document.createElement('td');
  const totalAmountSum = transactions.reduce((total, t) => total + t.amount, 0);
  if (totalAmountSum) {
    totalAmount.innerText = totalAmountSum.toFixed(2);
    totalAmount.classList.add(totalAmountSum > 0 ? 'positive' : 'negative');
  }
  totalRow.appendChild(totalAmount);

  const totalFee = document.createElement('td');
  const totalFeeSum = transactions.reduce((total, t) => total + t.fee, 0);
  if (totalFeeSum) {
    totalFee.innerText = totalFeeSum.toFixed(2);
    totalFee.classList.add(totalFeeSum > 0 ? 'positive' : 'negative');
  }
  totalRow.appendChild(totalFee);

  const totalTax = document.createElement('td');
  const totalTaxSum = transactions.reduce((total, t) => total + t.tax, 0);
  if (totalTaxSum) {
    totalTax.innerText = totalTaxSum.toFixed(2);
    totalTax.classList.add(totalTaxSum > 0 ? 'positive' : 'negative');
  }
  totalRow.appendChild(totalTax);

  const totalGainLoss = document.createElement('td');
  const gainLossSum = transactions.reduce((total, t) => total + t.gainOrLoss, 0);
  if (gainLossSum) {
    totalGainLoss.innerText = gainLossSum.toFixed(2);
    totalGainLoss.classList.add(gainLossSum > 0 ? 'positive' : 'negative');
  }
  totalRow.appendChild(totalGainLoss);

  const gainLossPerYear = new Map<number, number>();
  for (const transaction of transactions) {
    if (transaction.gainOrLoss === 0) continue;
    const year = transaction.time.getUTCFullYear();
    const gainLoss = gainLossPerYear.get(year) || 0;
    gainLossPerYear.set(year, gainLoss + transaction.gainOrLoss);
  }

  if (gainLossPerYear.size > 0) {
    const gainLossHeader = document.createElement('h3');
    gainLossHeader.innerText = `Gain/Loss for ${title} per year`;
    result.appendChild(gainLossHeader);
    const gainTable = document.createElement('table');
    result.appendChild(gainTable);
    const gainThead = document.createElement('thead');
    const gainHeaderRow = document.createElement('tr');
    gainThead.appendChild(gainHeaderRow);
    gainTable.appendChild(gainThead);
    const gainHeaders = ['Year', 'Gain/Loss'];
    for (const header of gainHeaders) {
      const th = document.createElement('th');
      th.innerText = header;
      if (isNumericHeader(header)) th.classList.add('numeric');
      gainHeaderRow.appendChild(th);
    }
    for (const [year, gainLoss] of gainLossPerYear) {
      const row = document.createElement('tr');
      gainTable.appendChild(row);
      const yearCell = document.createElement('td');
      yearCell.innerText = String(year);
      row.appendChild(yearCell);
      const gainLossCell = document.createElement('td');
      gainLossCell.innerText = gainLoss.toFixed(2);
      gainLossCell.classList.add(gainLoss > 0 ? 'positive' : 'negative');
      row.appendChild(gainLossCell);
    }
  }

  return result;
}
