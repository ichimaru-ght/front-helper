import { getAllFilePaths, handleTsxFilesByAst, handleTsxFilesByCode } from '../utils';
import j from 'jscodeshift';
import { removeIntlDeclaration, transformIntlMessages } from './removeIntl';
import { transformFormattedMessage } from './removeFormattedMessage';
import { removeAllReactIntlImports } from './removeImport';

export let messages: Record<string, string> = {};

const handleCode = (ast: any, filePath: string) => {
  const root = j(ast);
  transformIntlMessages(root, filePath);
  transformFormattedMessage(root, filePath);
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
  handleTsxFilesByAst(tsxFiles, handleCode);
};

export default intlReset;
