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
  let values: any = null;
  let defaultMessage: string | null = null;
  (node.openingElement.attributes as any[]).forEach((attr) => {
    if (attr.name?.name === 'id' && attr.value?.type === 'StringLiteral') {
      id = attr.value.value;
    } else if (attr.name?.name === 'values') {
      values = attr.value?.expression || attr.value;
    } else if (attr.name?.name === 'defaultMessage' && attr.value?.type === 'StringLiteral') {
      defaultMessage = attr.value.value;
    }
  });

  return { id, values, defaultMessage };
};

const buildI18nTCall = (id: string, valuesExpr: any) => {
  const paramMap = getParamMap(valuesExpr);
  delete (paramMap as any).defaultValue;
  const properties = Object.entries(paramMap).map(([key, value]) => j.property('init', j.identifier(key), value));
  const defaultValue = messages[id] || id;
  properties.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  const options = j.objectExpression(properties);
  return j.callExpression(j.memberExpression(j.identifier('I18n'), j.identifier('t')), [j.stringLiteral(id), options]);
};

export const transformFormattedMessage = (root: Collection, filePath: string) => {
  root.find(j.JSXElement, matchFormattedMessage).forEach((path) => {
    const parent = path.parent.node;
    const { id, values } = getFormattedMessageProps(path.node);
    if (!id) {
      console.log(`[FormatedMessage] 无id`, filePath);
      return;
    }
    const callExpr = buildI18nTCall(id, values);

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
