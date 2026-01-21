import j, { Collection } from 'jscodeshift';

export const replaceUseIntlHook = (root: Collection) => {
  root
    .find(j.VariableDeclaration, {
      declarations: (declarations: any[]) =>
        declarations.length === 1 &&
        declarations[0].id?.type === 'Identifier' &&
        declarations[0].id?.name === 'intl' &&
        declarations[0].init?.type === 'CallExpression' &&
        declarations[0].init.callee?.name === 'useIntl',
    })
    .replaceWith(() => {
      const tProp = j.property('init', j.identifier('t'), j.identifier('t'));
      (tProp as any).shorthand = true;
      const pattern = j.objectPattern([tProp]);
      const call = j.callExpression(j.identifier('useTranslation'), []);
      return j.variableDeclaration('const', [j.variableDeclarator(pattern, call)]);
    });
};
