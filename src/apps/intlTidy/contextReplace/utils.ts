import j from 'jscodeshift';

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
