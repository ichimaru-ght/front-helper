import { parse, ParseResult } from '@babel/parser';
import Progress from 'progress';
import colors from '@colors/colors';
import generator from '@babel/generator';
import fs from 'fs';

export const codeToAst = (code: string) => {
  return parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'asyncGenerators',
      'bigInt',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      ['decorators', { decoratorsBeforeExport: false }],
      'doExpressions',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'functionBind',
      'functionSent',
      'importMeta',
      'logicalAssignment',
      'nullishCoalescingOperator',
      'numericSeparator',
      'objectRestSpread',
      'optionalCatchBinding',
      'optionalChaining',
      ['pipelineOperator', { proposal: 'minimal' }],
      'throwExpressions',
      'topLevelAwait',
      /*  'estree', */
    ],
  });
};

export const handleTsxFilesByAst = (
  files: string[],
  fileHandler: (ast: Partial<ParseResult<File>>, filePath: string) => void,
) => {
  const bar = new Progress(colors.yellow('正在处理tsx文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: files.length,
  });
  files.forEach((tsxFile) => {
    const file = fs.readFileSync(tsxFile).toString();
    const ast = codeToAst(file);
    fileHandler(ast, tsxFile);
    const { code } = generator(ast, { retainLines: true });
    fs.writeFileSync(tsxFile, code);
    bar.tick(1);
  });
};

export const handleTsxFilesByCode = (files: string[], fileHandler: (ast: string) => string) => {
  const bar = new Progress(colors.yellow('正在处理tsx文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: files.length,
  });
  files.forEach((tsxFile) => {
    const file = fs.readFileSync(tsxFile).toString();
    const code = fileHandler(file);
    fs.writeFileSync(tsxFile, code);
    bar.tick(1);
  });
};
