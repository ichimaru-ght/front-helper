import { getAllFilePaths, handleTsxFilesByRoot, logger } from '../../utils';
import fs from 'fs';
import { configDefault } from './config';
import { handleContextReplace } from './contextReplace';
import { handleIntlCode } from './intlReplace';
import { flattenLanguageJson } from './utils';

import { exportExcel } from './utils/exportExcel';
import { getLocalConfig } from '../../utils/localConfig';

export let messages: Record<string, string> = {};
export let config: any = {};

export const usedKeys: Set<string> = new Set();

export const recordKeyUsage = (key: string) => {
  if (typeof key === 'string' && key) usedKeys.add(key);
};

const intlReset = (modeRaw?: string, pathRaw?: string) => {
  config = { ...configDefault, ...getLocalConfig() };

  const mode = modeRaw || config.mode;
  const path = pathRaw || config.path;

  const filePaths = getAllFilePaths(path);
  const tsxFiles = filePaths.filter((file) => file.endsWith('.tsx'));

  const jsonList = config.languageJsonList;
  const mergedMessages = [...jsonList].reverse().reduce<Record<string, string>>((prev, cur) => {
    const raw = require(cur.jsonPath);
    const json = raw?.default || raw;
    return { ...prev, ...flattenLanguageJson(json) };
  }, {});

  messages = mergedMessages;
  const handler = mode === 'intl' ? handleIntlCode : handleContextReplace;
  handleTsxFilesByRoot(tsxFiles, handler);
  exportExcel(usedKeys, jsonList, 'intl-export.xlsx', 'Sheet1');

  const scanRemaining = (files: string[]) => {
    const has = (code: string, re: RegExp) => re.test(code);
    const res = {
      getMessage: [] as string[],
      formatMessage: [] as string[],
      FormattedMessage: [] as string[],
      useLanguage: [] as string[],
    };
    files.forEach((p) => {
      const code = fs.readFileSync(p, 'utf8');
      if (has(code, /getMessage\s*\(/)) res.getMessage.push(p);
      if (has(code, /formatMessage\s*\(/)) res.formatMessage.push(p);
      if (has(code, /<FormattedMessage\b/)) res.FormattedMessage.push(p);
      if (has(code, /useLanguage\s*\(/)) res.useLanguage.push(p);
    });
    return res;
  };
  const remaining = scanRemaining(tsxFiles);
  if (remaining.getMessage.length) logger(`\n----- Remaining getMessage -----\n${remaining.getMessage.join('\n')}`);
  if (remaining.formatMessage.length)
    logger(`\n----- Remaining formatMessage -----\n${remaining.formatMessage.join('\n')}`);
  if (remaining.FormattedMessage.length)
    logger(`\n----- Remaining FormattedMessage -----\n${remaining.FormattedMessage.join('\n')}`);
  if (remaining.useLanguage.length) logger(`\n----- Remaining useLanguage -----\n${remaining.useLanguage.join('\n')}`);

  const unusedKeyTip = Object.keys(mergedMessages)
    .filter((k) => !usedKeys.has(k))
    .map((key) => {
      const value = mergedMessages[key];
      return `${key.replace(config.prefix, '').replaceAll('_', '.') || 'EMPTY_KEY'} : ${value || ''}`;
    })
    .join(`\n`);
  logger(`------ Not used keys ------ \n` + unusedKeyTip);
};

export default intlReset;
