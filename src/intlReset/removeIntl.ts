import j, { Collection } from 'jscodeshift';
import { buildTemplateLiteral, getParamMap } from './utils';
import { messages } from '.';

const getMessageIdAndDefault = (idObj: any): { id: string | null; defaultMessage: string | null } => {
  if (idObj.type !== 'ObjectExpression') return { id: null, defaultMessage: null };

  let id: string | null = null;
  let defaultMessage: string | null = null;

  (idObj.properties as any[]).forEach((prop) => {
    const propKey = prop.key?.name || prop.key?.value;
    if (propKey === 'id') {
      id = prop.value?.value || null;
    } else if (propKey === 'defaultMessage') {
      defaultMessage = prop.value?.value || null;
    }
  });
  return { id, defaultMessage };
};

export const removeIntlDeclaration = (root: Collection) => {
  root
    .find(j.VariableDeclaration, {
      declarations: (declarations: any[]) =>
        declarations.length === 1 &&
        declarations[0].id?.name === 'intl' &&
        declarations[0].init?.type === 'CallExpression' &&
        declarations[0].init.callee?.name === 'useIntl',
    })
    .remove();
};

export const transformIntlMessages = (root: Collection, filePath: string) => {
  const intlCalls = root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'intl' },
      property: { type: 'Identifier', name: 'formatMessage' },
    },
    arguments: (args) => args.length >= 1 && args[0].type === 'ObjectExpression',
  });

  if (intlCalls.size() === 0) return;

  intlCalls.replaceWith((path) => {
    const [idObj, paramsObj] = path.node.arguments;
    const { id: messageId, defaultMessage } = getMessageIdAndDefault(idObj);
    if (!messageId) {
      console.error(`[intl 调用] 无id`, filePath);
      return path.node;
    }
    const messageTemplate = messages[messageId] || defaultMessage;

    if (!messageTemplate) {
      // 跳过无 id 或无模板的情况
      console.error(`[intl 调用] 无匹配模板（id: ${messageId || '未知'}）`, filePath);
      return path.node;
    }

    const paramMap = getParamMap(paramsObj);

    return buildTemplateLiteral(messageTemplate, paramMap);
  });
};
