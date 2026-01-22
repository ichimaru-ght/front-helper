import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export type CreateExcelOptions = {
  columns: string[];
  outputPath: string;
  sheetName?: string;
};

export const createExcel = (options: CreateExcelOptions) => {
  const { columns, outputPath, sheetName = 'Sheet1' } = options;
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([columns]);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  XLSX.writeFile(workbook, outputPath);
};

export type AppendRowsOptions = {
  outputPath: string;
  rows: (string | number | boolean | null)[][];
  sheetName?: string;
};

export const appendRows = (options: AppendRowsOptions) => {
  const { outputPath, rows, sheetName } = options;
  const exists = fs.existsSync(outputPath);
  const workbook = exists ? XLSX.readFile(outputPath) : XLSX.utils.book_new();
  const targetSheetName = sheetName || (exists ? workbook.SheetNames[0] || 'Sheet1' : 'Sheet1');
  let worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    worksheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, worksheet, targetSheetName);
  }
  const ref = worksheet['!ref'];
  const range = ref ? XLSX.utils.decode_range(ref) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  const origin = ref ? { r: range.e.r + 1, c: 0 } : { r: 0, c: 0 };
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin });
  XLSX.writeFile(workbook, outputPath);
};
