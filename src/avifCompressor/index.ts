import colors from '@colors/colors';
import { codeToAst, getAllFilePaths } from '../utils';
import Progress from 'progress';
import fs from 'fs';
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import {
  identifier,
  importDeclaration,
  importDefaultSpecifier,
  importSpecifier,
  jSXAttribute,
  jsxExpressionContainer,
  jsxIdentifier,
  stringLiteral,
} from '@babel/types';
import path from 'path';

const runtimeConfig: {
  handleAllPic: boolean;
  forceNeedHandleSet?: Set<string>;
  imageTester: RegExp;
  fillComponent: {
    name: string;
    path: string;
    exportType: 'const' | 'default';
  };
} = {
  handleAllPic: false,
  imageTester: /\.(png|jpg|jpeg)$/i,
  fillComponent: {
    name: 'AvifStaticImage',
    path: '@/components/ImageAdapter',
    exportType: 'const',
  },
};

const needCompressSet = new Set<string>();

const splitFileName = (value: string) => {
  const pathArr = value.split('/');
  const fileName = pathArr.pop() || '';
  const dirName = pathArr.join('/');
  return [dirName, fileName];
};

const handlerAst = (ast: any) => {
  const allPngList: string[] = [];
  const allAvifSet: Set<string> = new Set();
  const fileMap: Record<string, string> = {};

  let lastImport: any;
  let hasfillComponent = false;
  traverse(ast, {
    ImportDeclaration(path) {
      const {
        specifiers = [],
        source: { value },
      } = path.node;
      lastImport = path;
      const [importSpecifier] = specifiers;
      if (specifiers.find((importSpecifier) => importSpecifier?.local.name === runtimeConfig.fillComponent.name))
        hasfillComponent = true;

      if (runtimeConfig.imageTester.test(value) || value.endsWith('.avif')) {
        const [dirName, imageFileName] = splitFileName(value);
        const name = imageFileName.replace(runtimeConfig.imageTester, '').replace('.avif', '');
        fileMap[name] = importSpecifier?.local.name;
        if (imageFileName.endsWith('.avif')) {
          allAvifSet.add(name);
        } else {
          allPngList.push(name);
        }
      }
    },
  });

  console.log('allAvifSet', allAvifSet, 'allPngList', allPngList);

  const needAddList: string[] = allPngList.filter((item) => !allAvifSet.has(item));
  const needAddImportNameSet = new Set(needAddList.map((item) => fileMap[item]).filter(Boolean));
  needAddList.forEach((item) => needCompressSet.add(item));

  const processedImports = new WeakSet();

  if (!needAddList.length) {
    return false;
  }

  !hasfillComponent &&
    lastImport.insertAfter(
      importDeclaration(
        [
          runtimeConfig.fillComponent.exportType === 'const'
            ? importSpecifier(
                identifier(runtimeConfig.fillComponent.name),
                identifier(runtimeConfig.fillComponent.name),
              )
            : importDefaultSpecifier(identifier(runtimeConfig.fillComponent.name)),
        ],
        stringLiteral(runtimeConfig.fillComponent.path),
      ),
    );

  traverse(ast, {
    ImportDeclaration(path) {
      if (processedImports.has(path.node)) return;
      const {
        specifiers: [importSpecifier],
        source: { value },
      } = path.node;
      if (runtimeConfig.imageTester.test(value)) {
        const [dirName, imageFileName] = splitFileName(value);
        const name = imageFileName.replace(runtimeConfig.imageTester, '');
        if (needCompressSet.has(name)) {
          const newImport = importDeclaration(
            [importDefaultSpecifier(identifier(`${importSpecifier?.local.name}Avif`))],
            stringLiteral(dirName + '/' + imageFileName.replace(runtimeConfig.imageTester, '.avif')),
          );
          path.insertAfter(newImport);
          processedImports.add(newImport);
        }
      }
    },
    JSXElement(path) {
      const { openingElement, closingElement } = path.node;
      if (openingElement.name?.name === 'img') {
        const srcAttribute = openingElement.attributes.find((attr) => {
          return attr.name.name === 'src' && needAddImportNameSet.has(attr.value.expression.name);
        });
        if (srcAttribute) {
          openingElement.attributes.push(
            jSXAttribute(
              jsxIdentifier('avifSrc'),
              jsxExpressionContainer(identifier(`${srcAttribute.value.expression.name}Avif`)),
            ),
          );
          openingElement.name = jsxIdentifier(runtimeConfig.fillComponent.name);
          console.log(openingElement.name);
          if (closingElement) {
            closingElement.name = jsxIdentifier(runtimeConfig.fillComponent.name);
          }
        }
      }
    },
  });
  return true;
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
    console.log('tsxFile', tsxFile);
    const ast = codeToAst(file);
    const changed = handlerAst(ast);
    console.log('changed', changed);
    if (changed) {
      const { code } = generator(ast, { retainLines: true });
      fs.writeFileSync(tsxFile, code);
    }
    bar.tick(1);
  });
};

const handlePicFiles = async (picFiles: string[]) => {
  console.log('needCompressSet', needCompressSet);
  // 这里使用全局sharp
  const globalSharpPath = require('child_process').execSync('npm root -g').toString().trim();
  const sharp = require(path.join(globalSharpPath, 'sharp'));

  const bar = new Progress(colors.brightBlue('正在处理图片文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: picFiles.length,
  });
  for (const pic of picFiles) {
    const [dirName, imageFileName] = splitFileName(pic);
    const name = imageFileName.replace(runtimeConfig.imageTester, '');

    // set优先级比all高
    const needHandle = runtimeConfig.forceNeedHandleSet
      ? runtimeConfig.forceNeedHandleSet.has(name)
      : needCompressSet.has(name) || runtimeConfig.handleAllPic;

    if (needHandle) {
      await sharp(pic).avif({ quality: 90 }).toFile(pic.replace(runtimeConfig.imageTester, '.avif'));
    }
    bar.tick(1);
  }
};

const avifCompressor = () => {
  console.log(colors.blue(`开始加载配置文件`));
  const path = require('path');

  const configPath = path.join(process.cwd(), 'avif-compressor.config.js');
  const config = require(configPath);

  console.log(colors.blue(`配置文件加载完毕`));
  const { imageConfig, tsxConfig } = config;

  if (tsxConfig) {
    tsxConfig.fillComponent && (runtimeConfig.fillComponent = tsxConfig.fillComponent);
    const files = getAllFilePaths(tsxConfig.path || 'src');
    const tsxFiles = files.filter((file) => file.endsWith('.tsx'));
    handleTsxFiles(tsxFiles);
  }

  if (imageConfig) {
    runtimeConfig.handleAllPic = imageConfig.handleAll;
    runtimeConfig.imageTester = imageConfig.test;
    if (imageConfig.specificPaths) {
      runtimeConfig.forceNeedHandleSet = new Set(imageConfig.specificPaths);
    }
    const files = getAllFilePaths(imageConfig.path || 'src');
    const picFiles = files.filter((file) => runtimeConfig.imageTester.test(file));
    handlePicFiles(picFiles);
  }
};
export default avifCompressor;
