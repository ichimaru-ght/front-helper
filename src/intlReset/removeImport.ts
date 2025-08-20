import j, { Collection } from 'jscodeshift';

export const removeAllReactIntlImports = (root: Collection) => {
  // 查找所有从'react-intl'导入的声明
  root
    .find(j.ImportDeclaration, {
      source: { value: 'react-intl' },
    })
    .remove(); // 直接移除整个导入语句
};
