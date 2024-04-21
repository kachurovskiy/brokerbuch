import './style.css'
import { parseTransactionFile } from './parser';
import { TransactionFile } from './interfaces';
import { SectionErrors } from './sectionerrors';
import { SectionYears } from './sectionyears';
import { prepareDataModel } from './processor';
import { SectionGroups } from './sectiongroups';

const inputElement = document.getElementById('transactionInput') as HTMLInputElement;
inputElement.addEventListener('change', readFile);
function readFile() {
  const files = inputElement.files;
  if (!files) return;
  const file = files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      renderTransactionFile(parseTransactionFile(reader.result as string));
    } catch (e) {
      alert(`Error parsing file: ${e}`);
    }
  };
  reader.onerror = (e) => {
    alert(`Error reading file: ${e}`);
  }
  reader.readAsText(file);
}
readFile();

function renderTransactionFile(file: TransactionFile) {
  const model = prepareDataModel(file);
  const outputElement = document.getElementById('transactionOutput')!;
  outputElement.replaceChildren(
    new SectionErrors().render(model),
    new SectionYears('stocks', [], model.cryptoIsins).render(model),
    new SectionYears('crypto', model.cryptoIsins, []).render(model),
    new SectionGroups().render(model),
  );
}
