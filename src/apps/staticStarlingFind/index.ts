import { getAllFilePaths, handleTsxFilesByAst } from '../../utils';
import { config } from './config';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const processFile = (ast: any, filePath: string) => {
  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      const isT = t.isIdentifier(callee) && callee.name === 't';
      const isI18nT =
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        callee.object.name === 'i18n' &&
        ((t.isIdentifier(callee.property) && callee.property.name === 't') ||
          (t.isStringLiteral(callee.property) && callee.property.value === 't'));
      if (!(isT || isI18nT)) return;

      if (path.getFunctionParent()) return;

      console.log('path', filePath);
    },
  });
};

const tool = (path: string) => {
  const finalPath = path || config.defaultSrc;
  if (!finalPath) {
    console.log('没有有效路径');
  }
  const files = getAllFilePaths(finalPath);
  let picFiles = files.filter((file) => config.pathFilter?.(file));
  console.log('tool execute files', picFiles);

  handleTsxFilesByAst(picFiles, processFile, true);
};

export default tool;
