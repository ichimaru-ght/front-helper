import j from 'jscodeshift';

export const getFlattenKey = (segments: string[]) => segments.filter(Boolean).join('_');

export const getPropName = (node: any): string | null => {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'StringLiteral' || node.type === 'Literal') return node.value;
  if (node.type === 'NumericLiteral') return String(node.value);
  return null;
};

export const buildObjectKey = (name: string) => {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) return j.identifier(name);
  return j.stringLiteral(name);
};

export const flattenObjectExpressionToProperties = (valueNode: any, prefixSegments: string[] = []): any[] => {
  if (!valueNode) return [];
  if (valueNode.type !== 'ObjectExpression') {
    return [j.spreadElement(valueNode)];
  }

  const next: any[] = [];
  (valueNode.properties || []).forEach((prop: any) => {
    if (prop.type === 'SpreadElement') {
      next.push(prop);
      return;
    }
    if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') return;

    const keyName = getPropName(prop.key);
    if (!keyName) {
      next.push(prop);
      return;
    }

    const mergedPrefix = [...prefixSegments, keyName];
    const propValue = prop.value;

    if (propValue && propValue.type === 'ObjectExpression' && prop.computed !== true) {
      next.push(...flattenObjectExpressionToProperties(propValue, mergedPrefix));
      return;
    }

    const flattenedKey = getFlattenKey(mergedPrefix);
    next.push(j.property('init', buildObjectKey(flattenedKey), propValue));
  });

  return next;
};
