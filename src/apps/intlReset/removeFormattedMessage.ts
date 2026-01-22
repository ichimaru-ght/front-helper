import j, { Collection } from 'jscodeshift';
import { messages } from '.';
import { getParamMap } from './utils';

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

const buildI18nTCall = (idOrNull: string | null, idNode: any, valuesExpr: any, defaultMessage: string | null, fallbackString: string | null) => {
  const paramMap = getParamMap(valuesExpr);
  delete (paramMap as any).defaultValue;
  const properties = Object.entries(paramMap).map(([key, value]) => j.property('init', j.identifier(key), value));
  const defaultValue =
    (idOrNull ? messages[idOrNull] : null) ||
    (idOrNull ? idOrNull : null) ||
    defaultMessage ||
    fallbackString ||
    '';
  properties.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  const options = j.objectExpression(properties);
  const idArg = idNode || (idOrNull ? j.literal(idOrNull) : j.literal(''));
  return j.callExpression(j.memberExpression(j.identifier('I18n'), j.identifier('t')), [idArg, options]);
};

export const transformFormattedMessage = (root: Collection, filePath: string) => {
  root.find(j.JSXElement, matchFormattedMessage).forEach((path) => {
    const parent = path.parent.node;
    const { id, idNode, values, defaultMessage, fallbackString } = getFormattedMessageProps(path.node);
    const callExpr = buildI18nTCall(id, idNode, values, defaultMessage, fallbackString);

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
