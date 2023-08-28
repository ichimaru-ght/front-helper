#!/usr/bin/env node

import { codeToAst } from './ast';
import { getAllFilePaths } from './file';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import { importSpecifier, identifier, jsxIdentifier, importDeclaration, stringLiteral } from '@babel/types';
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
      // 文件夹中已经有index.ts
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
  const dirFilesMap: DirFilsMap = {};
  // 提取出使用react component引入的组件，并删除掉对应的引入
  traverse(ast, {
    ImportDeclaration(path) {
      const {
        specifiers: [importSpecifier],
        source: { value },
      } = path.node;
      if (value.endsWith('.svg') && importSpecifier.imported?.name === 'ReactComponent') {
        const [dirName, svgName] = splitFileName(value);
        const camelSvgName = svgFileTOCamelCase(svgName);
        const importedComponentName = importSpecifier.local.name;
        transferMap[importedComponentName] = camelSvgName;
        if (dirFilesMap[dirName]) {
          dirFilesMap[dirName].push(camelSvgName);
        } else {
          dirFilesMap[dirName] = [camelSvgName];
        }

        path.remove();
      }
    },
  });

  traverse(ast, {
    ImportDeclaration(path) {
      const {
        specifiers,
        source: { value },
      } = path.node;
      const svgComponents = dirFilesMap[value];
      if (svgComponents) {
        // 已经有来自同一个文件夹的引入，写入新的specifiers
        svgComponents.forEach((item) => {
          const specifier = importSpecifier(identifier(item), identifier(item));
          specifiers.push(specifier);
          delete dirFilesMap[value];
        });
      }
    },
    JSXElement(path) {
      const { openingElement, closingElement } = path.node;
      const JSXName = openingElement.name.name;
      if (transferMap[JSXName]) {
        const newJSXName = jsxIdentifier(transferMap[JSXName]);
        openingElement.name = newJSXName;
        if (closingElement) {
          closingElement.name = newJSXName;
        }
      }
    },
  });
  traverse(ast, {
    Program(path) {
      const imports = Object.entries(dirFilesMap).map(([key, value]) => {
        const specifiers = value.map((item) => {
          return importSpecifier(identifier(item), identifier(item));
        });
        const source = stringLiteral(key);
        return importDeclaration(specifiers, source);
      });
      path.unshiftContainer('body', imports);
    },
  });
};

const handleTsxFiles = (tsxFiles: string[]) => {
  tsxFiles.forEach((tsxFile) => {
    const file = fs.readFileSync(tsxFile).toString();

    const ast = codeToAst(file);

    handlerAst(ast);
    const { code } = generator(ast, { retainLines: true });
    fs.writeFileSync(tsxFile, code);
  });
};

const main = () => {
  fs.writeFileSync('src/logger.txt', '');

  const files = getAllFilePaths('src');
  const svgFiles = files.filter((file) => file.endsWith('.svg'));
  const tsxFiles = files.filter((file) => file.endsWith('.tsx'));

  handleTsxFiles(tsxFiles);
  /*   logger(svgFiles.join(`\n`)); */
  handleSvgFiles(svgFiles);
  // logger(tsxFiles.join(`\n`));
};

main();
