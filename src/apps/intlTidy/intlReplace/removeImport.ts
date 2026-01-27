import j, { Collection } from 'jscodeshift';

export const removeAllReactIntlImports = (root: Collection) => {
  const reactIntl = root.find(j.ImportDeclaration, {
    source: { value: 'react-intl' },
  });

  reactIntl.forEach((path) => {
    const node = path.node;
    const specifiers = node.specifiers || [];
    const nextSpecifiers = specifiers.filter((spec: any) => {
      if (spec.type === 'ImportSpecifier') {
        const importedName = (spec.imported as any)?.name || (spec.imported as any)?.value;
        return importedName !== 'useIntl' && importedName !== 'FormattedMessage';
      }
      return true;
    });
    node.specifiers = nextSpecifiers;
  });
  reactIntl.filter((p) => (p.node.specifiers || []).length === 0).remove();

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
  const needUseTranslation =
    root
      .find(j.CallExpression, {
        callee: { type: 'Identifier', name: 'useTranslation' },
      })
      .size() > 0;

  const edenImport = root.find(j.ImportDeclaration, {
    source: { value: '@edenx/runtime/intl' },
  });
  if (!needI18n && !needUseTranslation) {
    edenImport.forEach((p) => {
      const node = p.node;
      const specifiers = node.specifiers || [];
      const filtered = specifiers.filter((s: any) => {
        if (s.type !== 'ImportSpecifier') return true;
        const name = (s.imported as any)?.name || (s.imported as any)?.value;
        return name !== 'I18n' && name !== 'useTranslation';
      });
      node.specifiers = filtered;
    });
    edenImport.filter((p) => (p.node.specifiers || []).length === 0).remove();
    return;
  }
  if (edenImport.size() === 0) {
    const specifiers: any[] = [];
    if (needI18n) specifiers.push(j.importSpecifier(j.identifier('I18n'), j.identifier('I18n')));
    if (needUseTranslation)
      specifiers.push(j.importSpecifier(j.identifier('useTranslation'), j.identifier('useTranslation')));
    root.find(j.Program).forEach((p) => {
      const newDecl = j.importDeclaration(specifiers, j.stringLiteral('@edenx/runtime/intl'));
      p.node.body.unshift(newDecl);
    });
  } else {
    edenImport.forEach((p) => {
      const node = p.node;
      const names = (node.specifiers || [])
        .filter((s: any) => s.type === 'ImportSpecifier')
        .map((s: any) => (s.imported as any)?.name || (s.imported as any)?.value);
      const keepNames: string[] = [];
      if (needI18n) keepNames.push('I18n');
      if (needUseTranslation) keepNames.push('useTranslation');
      node.specifiers = (node.specifiers || []).filter((s: any) => {
        if (s.type !== 'ImportSpecifier') return true;
        const name = (s.imported as any)?.name || (s.imported as any)?.value;
        return name !== 'I18n' && name !== 'useTranslation';
      });
      keepNames.forEach((n) => {
        if (!names.includes(n)) {
          (node.specifiers = node.specifiers || []).push(j.importSpecifier(j.identifier(n), j.identifier(n)));
        }
      });
    });
  }
};
