import j from 'jscodeshift';

export const buildTemplateLiteral = (template: string, paramMap: Record<string, any>) => {
  let remaining = template;
  const templateParts: string[] = [];
  const expressions: any[] = [];

  const paramOrder: string[] = [];
  const placeholderRegex = /\{(\w+)\}/g;
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    const paramName = match[1];
    if (paramMap[paramName] && !paramOrder.includes(paramName)) {
      paramOrder.push(paramName);
    }
  }

  paramOrder.forEach((paramName) => {
    const placeholder = `{${paramName}}`;
    let index = remaining.indexOf(placeholder);

    while (index !== -1) {
      if (index > 0) {
        templateParts.push(remaining.slice(0, index));
      }
      expressions.push(paramMap[paramName]);
      remaining = remaining.slice(index + placeholder.length);
      index = remaining.indexOf(placeholder);
    }
  });

  templateParts.push(remaining);

  // 强制补一个空字符串，避免 jscodeshift 报错
  if (templateParts.length === 0) {
    templateParts.push('');
  }

  return j.templateLiteral(
    templateParts.map((part, idx) => j.templateElement({ raw: part, cooked: part }, idx === templateParts.length - 1)),
    expressions,
  );
};

export const getParamMap = (paramsObj: any): Record<string, any> => {
  const paramMap: Record<string, any> = {};

  if (!paramsObj || paramsObj.type !== 'ObjectExpression') {
    return paramMap;
  }

  (paramsObj.properties as any[]).forEach((prop) => {
    const paramName = prop.key?.name || prop.key?.value;
    const paramValue = prop.value;

    if (paramName && paramValue) {
      paramMap[paramName] = paramValue;
    }
  });

  return paramMap;
};
