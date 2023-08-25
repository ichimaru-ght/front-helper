#!/usr/bin/env node

import { codeToAst } from './ast';
import { getAllFilePaths } from './file';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
/* import escodegen from 'escodegen' */
import fs from 'fs';

const logger = (content: string) => {
  fs.appendFileSync('src/logger.txt', `\n========= \n`);
  fs.appendFileSync('src/logger.txt', content);
};

const svgFileTOCamelCase = (value: string) => {
  const test = /[_-](\w)/g;
  const parsedValue = value.replace('.svg', '').replace(test, (_, letter) => {
    return letter.toUpperCase();
  });

  return parsedValue[0].toUpperCase() + parsedValue.slice(1);
};

const getSvgExport = (fileName: string) =>
  `export { ReactComponent as ${svgFileTOCamelCase(fileName)} } from './${fileName}';\n`;

const splitFileName = (value: string) => {
  const pathArr = value.split('/');
  const fileName = pathArr.pop() || '';
  const dirName = pathArr.join('/');
  return [dirName, fileName];
};

const handleSvgFiles = (svgFiles: string[]) => {
  const dirMap: Record<string, string[]> = {};
  svgFiles.forEach((file) => {
    const [dirName, svgName] = splitFileName(file);
    if (dirMap[dirName]) {
      dirMap[dirName].push(svgName);
    } else {
      dirMap[dirName] = [svgName];
    }
  });
  Object.keys(dirMap).forEach((dir) => {
    const indexFilePath = dir + '/index.ts';
    const hasIndex = fs.existsSync(indexFilePath);
    if (hasIndex) {
      const existedIndex = fs.readFileSync(indexFilePath).toString();
      const reg = /([\w_-])+.svg/g;
      const importedSet = new Set<string>();
      Array.from(existedIndex.matchAll(reg)).forEach((item) => {
        importedSet.add(item[0]);
      });
      const filteredFilePath = dirMap[dir].filter((item) => {
        return !importedSet.has(item);
      });
      fs.appendFileSync(indexFilePath, filteredFilePath.map((file) => getSvgExport(file)).join(''));
    } else {
      fs.appendFileSync(indexFilePath, dirMap[dir].map((file) => getSvgExport(file)).join(''));
    }
  });
};

type DirFilsMap = Record<string, string[]>;
const handlerAst = (ast: any) => {
  const transferMap: Record<string, string> = {};
  const importList: string[] = [];
  const dirFilesMap: DirFilsMap = {};
  traverse(ast, {
    ImportDeclaration(path) {
      const {
        specifiers: [importSpecifier],
        source: { value },
      } = path.node;
      if (value.endsWith('.svg') && importSpecifier.imported.name === 'ReactComponent') {
        const [dirName, svgName] = splitFileName(value);
        const camelSvgName = svgFileTOCamelCase(svgName);
        const importedComponentName = importSpecifier.local.name;
        transferMap[importedComponentName] = camelSvgName;
        if (dirFilesMap[dirName]) {
          dirFilesMap[dirName].push(camelSvgName);
        } else {
          dirFilesMap[dirName] = [camelSvgName];
        }
        importList.push(value);
        path.remove();
      }
    },
  });
  traverse(ast, {
    ImportDeclaration(path, scope) {
      const {
        specifiers: [importSpecifier],
        source: { value },
      } = path.node;
      /* if (value.endsWith('style')) {
        console.log('scope', scope);
        logger(JSON.stringify(scope));
      } */
    },
  });
  console.log('importList', importList, 'dirFilesMap', dirFilesMap);
};

const handleTsxFiles = (tsxFiles: string[]) => {
  tsxFiles.forEach((tsxFile, index) => {
    const file = fs.readFileSync(tsxFile).toString();

    const ast = codeToAst(file);

    handlerAst(ast);
    const code = generator(ast, { retainLines: true });
    logger(code.code);
  });
};

const main = () => {
  fs.writeFileSync('src/logger.txt', '');

  const files = getAllFilePaths('srcTest/pages/Purchase');
  const svgFiles = files.filter((file) => file.endsWith('.svg'));
  const tsxFiles = files.filter((file) => file.endsWith('.tsx'));

  handleTsxFiles(tsxFiles);
  /*   logger(svgFiles.join(`\n`)); */
  handleSvgFiles(svgFiles);
  // logger(tsxFiles.join(`\n`));
};

main();
