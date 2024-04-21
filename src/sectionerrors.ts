import { DataModel } from "./interfaces";

export class SectionErrors {
  render(dataModel: DataModel): HTMLDivElement {
    const div = document.createElement('div');
    div.classList.add('sectionErrors');
    for (const error of dataModel.file.errors) {
      const errorElement = document.createElement('div');
      errorElement.innerText = error;
      errorElement.classList.add('error');
      div.appendChild(errorElement);
    }
    return div;
  }
}
