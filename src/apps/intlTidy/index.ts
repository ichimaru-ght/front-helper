import { getAllFilePaths, handleTsxFilesByRoot, logger } from '../../utils';
import { config } from './config';
import { handleContextReplace } from './contextReplace';
import { handleIntlCode } from './intlReplace';
import { flattenLanguageJson } from './utils';

import { exportExcel } from './utils/exportExcel';

export let messages: Record<string, string> = {};

const intlReset = (mode = 'context', path = 'src') => {
  const filePaths = getAllFilePaths(path);
  const tsxFiles = filePaths.filter((file) => file.endsWith('.tsx'));

  const jsonList = config.languageJsonList;
  const mergedMessages = [...jsonList].reverse().reduce((prev, cur) => {
    const raw = require(cur.jsonPath);
    const json = raw?.default || raw;
    return { ...prev, ...flattenLanguageJson(json) };
  }, {});

  logger(JSON.stringify(mergedMessages));

  messages = mergedMessages;
  const handler = mode === 'intl' ? handleIntlCode : handleContextReplace;
  handleTsxFilesByRoot(tsxFiles, handler);
  exportExcel(mergedMessages, jsonList);
};

export default intlReset;
