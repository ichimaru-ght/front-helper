import { flattenLanguageJson } from '.';
import { appendRows, createExcel } from '../../../utils/excel';

export type LanguageJsonInfo = {
  language: string;
  jsonPath: string;
};

const buildRows = (
  keys: string[],
  sourceMap: Record<string, string>,
  otherMaps: { lang: string; map: Record<string, string> }[],
) => {
  return keys.map((k) => {
    const source = sourceMap[k] ?? '';
    const others = otherMaps.map(({ map }) => map[k] ?? '');
    return [k, source, ...others];
  });
};

export const exportExcel = (
  usedKeys: Set<string>,
  languageJsonList: LanguageJsonInfo[],
  outputPath = 'intl-export.xlsx',
  sheetName = 'Sheet1',
) => {
  if (!languageJsonList?.length) return;
  const [sourceInfo, ...others] = languageJsonList;
  const sourceMap = flattenLanguageJson(require(sourceInfo.jsonPath));
  const otherMaps = others.map((item) => ({ lang: item.language, map: flattenLanguageJson(require(item.jsonPath)) }));
  const columns = ['keys', 'source', ...otherMaps.map((o) => o.lang)];
  createExcel({ columns, outputPath, sheetName });
  const rows = buildRows(Array.from(usedKeys), sourceMap, otherMaps);
  appendRows({ outputPath, rows, sheetName });
};
