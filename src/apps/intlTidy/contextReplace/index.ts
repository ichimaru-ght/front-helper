import j, { Collection } from 'jscodeshift';
import { messages } from '..';
import { getPropName, flattenObjectExpressionToProperties } from './utils';
import { collectState } from './collectState';
import { buildI18nTCall } from '../utils/starling';
import { replaceUseLanguageIdentifiers } from './removeUseLanguage';
import { getFlattenKey } from '../utils';

export type UseLanguageState = {
  rootObjectNames: Set<string>;
  bindingNameToSegments: Map<string, string[]>;
};

const isGetMessageCallee = (callee: any) => {
  if (!callee) return false;
  if (callee.type === 'Identifier') return callee.name === 'getMessage';
  if (callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') {
    if (callee.computed) return false;
    return callee.property?.type === 'Identifier' && callee.property.name === 'getMessage';
  }
  return false;
};

const extendStateWithAliases = (root: Collection, state: UseLanguageState) => {
  let changed = true;
  while (changed) {
    changed = false;
    root.find(j.VariableDeclarator).forEach((p) => {
      const id = p.node.id;
      const init = p.node.init;
      if (!init || id?.type !== 'Identifier') return;
      if (state.bindingNameToSegments.has(id.name)) return;
      if (state.rootObjectNames.has(id.name)) return;
      const initNode: any = (init as any)?.type === 'ChainExpression' ? (init as any).expression : init;
      if (initNode?.type !== 'Identifier') return;
      const segments = resolveExpressionToSegments(initNode, state);
      if (!segments || segments.length === 0) return;
      state.bindingNameToSegments.set(id.name, segments);
      changed = true;
    });
  }
};

const resolveExpressionToSegments = (expr: any, state: UseLanguageState): string[] | null => {
  if (!expr) return null;

  const node = expr.type === 'ChainExpression' ? expr.expression : expr;

  if (node.type === 'Identifier') {
    if (state.bindingNameToSegments.has(node.name)) return state.bindingNameToSegments.get(node.name)!;
    if (state.rootObjectNames.has(node.name)) return [];
    return null;
  }

  const isMember = node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression';
  if (!isMember) return null;

  const baseSegments = resolveExpressionToSegments(node.object, state);
  if (!baseSegments) return null;

  let propName: string | null = null;
  if (node.computed) {
    if (node.property?.type === 'StringLiteral' || node.property?.type === 'Literal') propName = node.property.value;
    else if (node.property?.type === 'NumericLiteral') propName = String(node.property.value);
    else return null;
  } else {
    propName = getPropName(node.property);
  }
  if (!propName) return null;

  return [...baseSegments, propName];
};

const replaceGetMessageCalls = (root: Collection, state: UseLanguageState) => {
  const replace = (nodeType: any) => {
    root
      .find(nodeType)
      .filter((p) => {
        const node: any = p.node;
        return isGetMessageCallee(node.callee) && (node.arguments || []).length >= 1;
      })
      .replaceWith((p) => {
        const node: any = p.node;
        const [baseExpr, optionsExpr] = node.arguments;

        let key: string | null = null;
        const segments = resolveExpressionToSegments(baseExpr, state);
        if (segments && segments.length > 0) {
          key = getFlattenKey(segments);
        } else if (baseExpr?.type === 'StringLiteral') {
          key = baseExpr.value;
        }
        if (!key) return node;

        let valueNode: any = null;
        if (optionsExpr?.type === 'ObjectExpression') {
          (optionsExpr.properties || []).forEach((prop: any) => {
            if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') return;
            const propKey = getPropName(prop.key);
            if (propKey !== 'value') return;
            valueNode = prop.value;
          });
        }

        const valueProps = flattenObjectExpressionToProperties(valueNode);
        return buildI18nTCall(key, j.objectExpression(valueProps), messages[key] || key);
      });
  };

  replace(j.CallExpression);
  const OptionalCallExpression = (j as any).OptionalCallExpression;
  if (OptionalCallExpression) replace(OptionalCallExpression);
};

const replaceUseLanguageMemberExpressions = (root: Collection, state: UseLanguageState) => {
  const replace = (nodeType: any) => {
    root
      .find(nodeType)
      .filter((p) => {
        const parent = p.parent?.node || p.parentPath?.node;
        if (!parent) return true;
        if (parent.type === 'MemberExpression' && parent.object === p.node) return false;
        if (parent.type === 'OptionalMemberExpression' && parent.object === p.node) return false;
        if (parent.type === 'AssignmentExpression' && parent.left === p.node) return false;
        if (parent.type === 'UpdateExpression' && parent.argument === p.node) return false;
        if (parent.type === 'CallExpression' && parent.callee === p.node) return false;
        if (parent.type === 'OptionalCallExpression' && parent.callee === p.node) return false;
        return true;
      })
      .replaceWith((p) => {
        const segments = resolveExpressionToSegments(p.node, state);
        if (!segments || segments.length === 0) return p.node;
        const key = getFlattenKey(segments);
        return buildI18nTCall(key, j.objectExpression([]), messages[key] || key);
      });
  };

  replace(j.MemberExpression);
  const OptionalMemberExpression = (j as any).OptionalMemberExpression;
  if (OptionalMemberExpression) replace(OptionalMemberExpression);
};

const ensureI18nImport = (root: Collection) => {
  const needI18n =
    root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'I18n' },
          property: { type: 'Identifier', name: 't' },
        },
      })
      .size() > 0 ||
    root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'I18n' },
          property: { type: 'StringLiteral', value: 't' },
        },
      })
      .size() > 0;
  if (!needI18n) return;

  const edenImport = root.find(j.ImportDeclaration, { source: { value: '@edenx/runtime/intl' } });
  if (edenImport.size() === 0) {
    root.find(j.Program).forEach((p) => {
      const decl = j.importDeclaration(
        [j.importSpecifier(j.identifier('I18n'), j.identifier('I18n'))],
        j.stringLiteral('@edenx/runtime/intl'),
      );
      p.node.body.unshift(decl);
    });
    return;
  }

  edenImport.forEach((p) => {
    const node = p.node;
    const specifiers = node.specifiers || [];
    const hasI18n = specifiers.some((s: any) => {
      if (s.type !== 'ImportSpecifier') return false;
      const imported = (s.imported as any)?.name || (s.imported as any)?.value;
      return imported === 'I18n';
    });
    if (!hasI18n) {
      specifiers.push(j.importSpecifier(j.identifier('I18n'), j.identifier('I18n')));
      node.specifiers = specifiers;
    }
  });
};

const cleanupUnusedImports = (root: Collection, state: UseLanguageState) => {
  root.find(j.ImportDeclaration).forEach((p) => {
    const node = p.node;
    let removedTarget = false;
    const next = (node.specifiers || []).filter((s: any) => {
      if (s.type !== 'ImportSpecifier') return true;
      const imported = (s.imported as any)?.name || (s.imported as any)?.value;
      if (imported === 'useLanguage' || imported === 'getMessage') {
        removedTarget = true;
        return false;
      }
      return true;
    });
    if (removedTarget && next.length === 0) {
      p.prune();
    } else {
      node.specifiers = next;
    }
  });
};

export const handleContextReplace = (root: any, filePath: string) => {
  const collection: Collection = root;
  const state = collectState(collection);

  const stateForGetMessage: UseLanguageState = {
    rootObjectNames: state.rootObjectNames,
    bindingNameToSegments: new Map(state.bindingNameToSegments),
  };
  extendStateWithAliases(collection, stateForGetMessage);

  replaceGetMessageCalls(collection, stateForGetMessage);
  replaceUseLanguageMemberExpressions(collection, state);
  replaceUseLanguageIdentifiers(collection, state);
  ensureI18nImport(collection);
  cleanupUnusedImports(collection, state);
};
