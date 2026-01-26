import { createExcel, appendRows } from '../../utils/excel';

export type LanguageJsonInfo = {
  language: string;
  jsonPath: string;
};

const buildRows = (
  mergedMap: Record<string, string>,
  sourceMap: Record<string, string>,
  otherMaps: { lang: string; map: Record<string, string> }[],
) => {
  const keys = Object.keys(mergedMap).filter(Boolean);
  return keys.map((k) => {
    let source = sourceMap[k];
    const others = otherMaps.map(({ map }) => map[k] ?? '');
    return [k, source ?? mergedMap[k], ...others];
  });
};

export const exportExcel = (
  mergedMap: Record<string, string>,
  languageJsonList: LanguageJsonInfo[],
  outputPath = 'intl-export.xlsx',
  sheetName = 'Sheet1',
) => {
  if (!languageJsonList?.length) return;
  const [sourceInfo, ...others] = languageJsonList;
  const sourceMap = require(sourceInfo.jsonPath);
  const otherMaps = others.map((item) => ({ lang: item.language, map: require(item.jsonPath) }));
  const columns = ['keys', 'source', ...otherMaps.map((o) => o.lang)];
  createExcel({ columns, outputPath, sheetName });
  const rows = buildRows(mergedMap, sourceMap, otherMaps);
  appendRows({ outputPath, rows, sheetName });
};
