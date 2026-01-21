import { removeIntlDeclaration, transformIntlMessages } from './removeIntl';
import { transformFormattedMessage } from './removeFormattedMessage';
import { removeAllReactIntlImports } from './removeImport';
import { replaceUseIntlHook } from './removeHookCall';
import { getAllFilePaths, handleTsxFilesByRoot } from '../../utils';

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
  const jsonRoot = '/Users/bytedance/Desktop/fe-monorepo/apps/lite-tms-ui/app/src/lang/';
  const enRoot = require(jsonRoot + 'en.json');
  const idRoot = require(jsonRoot + 'id.json');
  messages = { ...idRoot, ...enRoot };
  handleTsxFilesByRoot(tsxFiles, handleCode);
};

export default intlReset;
