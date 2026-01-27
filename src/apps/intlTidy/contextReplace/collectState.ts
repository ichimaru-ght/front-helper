import j, { Collection } from 'jscodeshift';
import { getPropName } from './utils';
import { UseLanguageState } from '.';

const isUseLanguageCallee = (callee: any) => callee?.type === 'Identifier' && callee.name === 'useLanguage';

const collectUseLanguageBindingsFromPattern = (
  pattern: any,
  prefix: string[],
  bindingNameToSegments: Map<string, string[]>,
  rootObjectNames: Set<string>,
) => {
  if (!pattern) return;
  if (pattern.type === 'Identifier') {
    rootObjectNames.add(pattern.name);
    return;
  }
  if (pattern.type !== 'ObjectPattern') return;

  (pattern.properties || []).forEach((prop: any) => {
    if (prop.type === 'RestElement') {
      if (prop.argument?.type === 'Identifier') {
        bindingNameToSegments.set(prop.argument.name, [...prefix]);
        rootObjectNames.add(prop.argument.name);
      }
      return;
    }
    if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') return;

    const keyName = getPropName(prop.key);
    if (!keyName) return;
    const nextPrefix = [...prefix, keyName];
    const value = prop.value;

    if (value.type === 'Identifier') {
      bindingNameToSegments.set(value.name, nextPrefix);
      return;
    }
    if (value.type === 'AssignmentPattern' && value.left?.type === 'Identifier') {
      bindingNameToSegments.set(value.left.name, nextPrefix);
      return;
    }
    if (value.type === 'ObjectPattern') {
      collectUseLanguageBindingsFromPattern(value, nextPrefix, bindingNameToSegments, rootObjectNames);
      return;
    }
    if (value.type === 'RestElement' && value.argument?.type === 'Identifier') {
      bindingNameToSegments.set(value.argument.name, nextPrefix);
      rootObjectNames.add(value.argument.name);
    }
  });
};

export const collectState = (root: Collection): UseLanguageState => {
  const rootObjectNames = new Set<string>();
  const bindingNameToSegments = new Map<string, string[]>();

  root.find(j.VariableDeclarator).forEach((p) => {
    const init = p.node.init;
    if (!init || init.type !== 'CallExpression') return;
    if (!isUseLanguageCallee(init.callee)) return;
    collectUseLanguageBindingsFromPattern(p.node.id, [], bindingNameToSegments, rootObjectNames);
  });

  return { rootObjectNames, bindingNameToSegments };
};
