import j, { Collection } from 'jscodeshift';

import { UseLanguageState } from '.';
import { messages } from '..';
import { buildI18nTCall } from '../utils/starling';
import { getFlattenKey } from './utils';

const isUseLanguageCallee = (callee: any) => callee?.type === 'Identifier' && callee.name === 'useLanguage';

const isReferenceIdentifier = (p: any) => {
  const parent = p.parentPath?.node;
  if (!parent) return true;

  if (parent.type === 'VariableDeclarator' && parent.id === p.node) return false;
  if (
    parent.type === 'FunctionDeclaration' ||
    parent.type === 'FunctionExpression' ||
    parent.type === 'ArrowFunctionExpression'
  ) {
    if ((parent.params || []).includes(p.node)) return false;
  }
  if (
    parent.type === 'ImportSpecifier' ||
    parent.type === 'ImportDefaultSpecifier' ||
    parent.type === 'ImportNamespaceSpecifier'
  )
    return false;
  if (
    (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
    parent.key === p.node &&
    parent.computed !== true
  )
    return false;
  if (
    (parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression') &&
    parent.property === p.node &&
    parent.computed !== true
  )
    return false;
  if ((parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression') && parent.object === p.node)
    return false;
  if (parent.type === 'JSXAttribute') return false;
  if (parent.type === 'TSPropertySignature') return false;

  return true;
};

const collectBindingNamesFromPattern = (pattern: any): string[] => {
  const names: string[] = [];
  if (!pattern) return names;
  if (pattern.type === 'Identifier') {
    names.push(pattern.name);
    return names;
  }
  if (pattern.type !== 'ObjectPattern') return names;
  (pattern.properties || []).forEach((prop: any) => {
    if (prop.type === 'RestElement') {
      if (prop.argument?.type === 'Identifier') names.push(prop.argument.name);
      return;
    }
    if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') return;
    const value = prop.value;
    if (value?.type === 'Identifier') {
      names.push(value.name);
      return;
    }
    if (value?.type === 'AssignmentPattern' && value.left?.type === 'Identifier') {
      names.push(value.left.name);
      return;
    }
    if (value?.type === 'ObjectPattern') {
      names.push(...collectBindingNamesFromPattern(value));
    }
  });
  return names;
};

export const replaceUseLanguageIdentifiers = (root: Collection, state: UseLanguageState) => {
  const candidates = Array.from(state.bindingNameToSegments.keys()).filter((n) => !state.rootObjectNames.has(n));
  if (candidates.length === 0) return;

  root
    .find(j.Identifier)
    .filter((p) => candidates.includes(p.node.name) && isReferenceIdentifier(p))
    .replaceWith((p) => {
      const segments = state.bindingNameToSegments.get(p.node.name);
      if (!segments || segments.length === 0) return p.node;
      const key = getFlattenKey(segments);
      return buildI18nTCall(key, j.objectExpression([]), messages[key] || key);
    });

  root.find(j.VariableDeclaration).forEach((p) => {
    const declarators = p.node.declarations || [];
    const nextDecls: any[] = [];
    declarators.forEach((d: any) => {
      const isUseLang = d.init?.type === 'CallExpression' && isUseLanguageCallee(d.init.callee);
      if (!isUseLang) {
        nextDecls.push(d);
        return;
      }
      const names = collectBindingNamesFromPattern(d.id);
      const anyUsed = names.some((n) => {
        return (
          root
            .find(j.Identifier, { name: n })
            .filter((pp) => isReferenceIdentifier(pp))
            .size() > 0
        );
      });
      if (anyUsed) {
        nextDecls.push(d);
      }
    });
    if (nextDecls.length === 0) {
      p.prune();
    } else {
      p.node.declarations = nextDecls;
    }
  });
};
