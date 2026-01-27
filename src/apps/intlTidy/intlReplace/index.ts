import { transformFormattedMessage } from './removeFormattedMessage';
import { replaceUseIntlHook } from './removeHookCall';
import { removeAllReactIntlImports } from './removeImport';
import { transformIntlMessages, removeIntlDeclaration } from './removeIntl';

export const handleIntlCode = (root: any, filePath: string) => {
  transformIntlMessages(root, filePath);
  transformFormattedMessage(root, filePath);
  replaceUseIntlHook(root);
  removeIntlDeclaration(root);
  removeAllReactIntlImports(root);
};
