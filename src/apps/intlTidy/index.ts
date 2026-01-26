import { removeIntlDeclaration, transformIntlMessages } from './removeIntl';
import { transformFormattedMessage } from './removeFormattedMessage';
import { removeAllReactIntlImports } from './removeImport';
import { replaceUseIntlHook } from './removeHookCall';
import { getAllFilePaths, handleTsxFilesByRoot } from '../../utils';
import { config } from './config';
import { exportExcel } from './exportExcel';

export let messages: Record<string, string> = {};

const handleCode = (root: any, filePath: string) => {
  transformIntlMessages(root, filePath);
  transformFormattedMessage(root, filePath);
  replaceUseIntlHook(root);
  removeIntlDeclaration(root);
  removeAllReactIntlImports(root);
};

const intlReset = (path = 'src') => {
  const filePaths = getAllFilePaths(path);
  const tsxFiles = filePaths.filter((file) => file.endsWith('.tsx'));

  const jsonList = config.languageJsonList.reverse();
  const mergedMessages = jsonList.reduce((prev, cur) => ({ ...prev, ...require(cur.jsonPath) }), {});

  messages = mergedMessages;
  handleTsxFilesByRoot(tsxFiles, handleCode);
  exportExcel(mergedMessages, jsonList);
};

export default intlReset;
