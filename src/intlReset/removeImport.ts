import j, { Collection } from 'jscodeshift';

export const removeAllReactIntlImports = (root: Collection) => {
  root
    .find(j.ImportDeclaration, {
      source: { value: 'react-intl' },
    })
    .remove();
};
