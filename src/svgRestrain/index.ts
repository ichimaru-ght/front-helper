import { codeToAst } from './ast';
import { getAllFilePaths } from './file';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import { importSpecifier, identifier, jsxIdentifier, importDeclaration, stringLiteral } from '@babel/types';
import fs from 'fs';
import colors from '@colors/colors';
import Progress from 'progress';

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
  console.log(colors.blue('svg 处理完毕'));
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
  const bar = new Progress(colors.yellow('正在处理tsx文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: tsxFiles.length,
  });
  tsxFiles.forEach((tsxFile) => {
    const file = fs.readFileSync(tsxFile).toString();
    const ast = codeToAst(file);
    handlerAst(ast);
    const { code } = generator(ast, { retainLines: true });
    fs.writeFileSync(tsxFile, code);
    bar.tick(1);
  });
};

const svgRestrain = (path: string) => {
  console.log(colors.blue(`开始扫描文件 /${path}`));
  const files = getAllFilePaths(path);
  const svgFiles = files.filter((file) => file.endsWith('.svg'));
  const tsxFiles = files.filter((file) => file.endsWith('.tsx'));

  handleSvgFiles(svgFiles);

  handleTsxFiles(tsxFiles);
  console.log(colors.green('处理完成'));
};

export default svgRestrain;
