import j, { Collection } from 'jscodeshift';
import { messages } from '..';
import { buildI18nTCall } from '../utils/starling';
import { getFlattenKey } from '../utils';

const matchFormattedMessage = (node: any): boolean => {
  return (
    node.type === 'JSXElement' &&
    node.openingElement?.name?.type === 'JSXIdentifier' &&
    node.openingElement.name.name === 'FormattedMessage'
  );
};

const getFormattedMessageProps = (node: any) => {
  let id: string | null = null;
  let idNode: any = null;
  let values: any = null;
  let defaultMessage: string | null = null;
  let fallbackString: string | null = null;
  (node.openingElement.attributes as any[]).forEach((attr) => {
    if (attr.name?.name === 'id') {
      const v = attr.value;
      if (v?.type === 'StringLiteral') {
        id = v.value;
        idNode = j.literal(v.value);
      } else if (v?.type === 'JSXExpressionContainer') {
        const expr = v.expression;
        if (expr?.type === 'StringLiteral') {
          id = expr.value;
          idNode = expr;
        } else if (expr?.type === 'LogicalExpression' && expr.operator === '||') {
          idNode = expr.left;
          if (expr.right?.type === 'StringLiteral') {
            fallbackString = expr.right.value;
          }
        } else {
          idNode = expr;
        }
      }
    } else if (attr.name?.name === 'values') {
      values = attr.value?.expression || attr.value;
    } else if (attr.name?.name === 'defaultMessage' && attr.value?.type === 'StringLiteral') {
      defaultMessage = attr.value.value;
    }
  });

  return { id, idNode, values, defaultMessage, fallbackString };
};

export const transformFormattedMessage = (root: Collection, filePath: string) => {
  root.find(j.JSXElement, matchFormattedMessage).forEach((path) => {
    const parent = path.parent.node;
    const { id, idNode, values, defaultMessage, fallbackString } = getFormattedMessageProps(path.node);
    if (!id) return;
    const parsedId = getFlattenKey([id]);
    const defaultValue = messages[parsedId] || defaultMessage || parsedId;
    const params = values && values.type === 'ObjectExpression' ? values : j.objectExpression([]);
    const callExpr = buildI18nTCall(parsedId, params, defaultValue);

    const parentType = parent.type;
    if (
      parentType === 'VariableDeclarator' || // 变量赋值
      parentType === 'CallExpression' || // 函数参数
      parentType === 'ConditionalExpression' || // 条件表达式
      parentType === 'ObjectProperty' // 对象属性
    ) {
      path.replace(callExpr);
    } else if (parentType === 'JSXExpressionContainer') {
      path.replace(callExpr);
    } else {
      path.replace(j.jsxExpressionContainer(callExpr));
    }
  });
};
