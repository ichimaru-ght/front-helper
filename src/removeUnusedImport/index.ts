import { getAllFilePaths, handleTsxFilesByAst } from '../utils';
import traverse from '@babel/traverse';

const handleAst = (ast: any) => {
  traverse(ast, {
    ImportDeclaration(path) {
      const { node } = path;
      const { specifiers } = node;
      if (!specifiers.length) {
        return;
      }
      node.specifiers = specifiers.filter((specifier) => {
        const { local } = specifier;
        const binding = path.scope.getBinding(local.name);
        return !!binding?.referenced;
      });
      if (node.specifiers.length === 0) {
        path.remove();
      }
    },
  });
};

const removeUnusedImport = (path: string) => {
  const filePaths = getAllFilePaths(path);
  const tsxFiles = filePaths.filter((file) => file.endsWith('.tsx'));
  handleTsxFilesByAst(tsxFiles, handleAst);
};

export default removeUnusedImport;
