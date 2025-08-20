import j, { Collection } from 'jscodeshift';
import { messages } from '.';
import { buildTemplateLiteral } from './utils';

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
  let defaultMessage: string | null = null; // 新增：提取defaultMessage

  (node.openingElement.attributes as any[]).forEach((attr) => {
    if (attr.name?.name === 'id' && attr.value?.type === 'StringLiteral') {
      id = attr.value.value;
    } else if (attr.name?.name === 'values') {
      values = attr.value?.expression || attr.value;
    } else if (attr.name?.name === 'defaultMessage' && attr.value?.type === 'StringLiteral') {
      // 新增：提取defaultMessage属性
      defaultMessage = attr.value.value;
    }
  });

  return { id, values, defaultMessage };
};

export const transformFormattedMessage = (root: Collection, filePath: string) => {
  // 一次遍历所有FormattedMessage，根据场景动态处理
  root.find(j.JSXElement, matchFormattedMessage).forEach((path) => {
    const parent = path.parent.node;
    const { id, values, defaultMessage } = getFormattedMessageProps(path.node);
    if (!id) {
      console.log(`[FormatedMessage] 无id`, filePath);
      return;
    }
    const messageTemplate = messages[id] || defaultMessage;

    if (!id || !messageTemplate) {
      console.log(`[FormatedMessage] 无模板`, filePath);
      return;
    }
    const paramMap =
      values?.type === 'ObjectExpression'
        ? (values.properties as any[]).reduce(
            (map, prop) => {
              const paramName = prop.key?.name || prop.key?.value;
              if (paramName) map[paramName] = prop.value;
              return map;
            },
            {} as Record<string, any>,
          )
        : {};

    const templateLiteral = buildTemplateLiteral(messageTemplate, paramMap);

    const parentType = parent.type;
    if (
      // 变量使用场景：直接替换为模板字符串
      parentType === 'VariableDeclarator' || // 变量赋值
      parentType === 'CallExpression' || // 函数参数
      parentType === 'ConditionalExpression' || // 条件表达式
      parentType === 'ObjectProperty' // 对象属性
    ) {
      path.replace(templateLiteral);
    } else if (parentType === 'JSXExpressionContainer') {
      console.log(`[处理] 未识别`, filePath, 'id:', id, templateLiteral);
      path.replace(j.jsxExpressionContainer(templateLiteral));
    }
  });
};
