import { parse } from '@babel/parser';
import generator from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import fs from 'fs';
import { getAllFilePaths, handleTsxFilesByAst } from '../utils';

// 写死的包名和路径
const TARGET_PACKAGE = '@arco-design/iconbox-react-m4b-next';

interface ImportSpecifierInfo {
  localName: string;
  importedName: string;
}

const handleCode = (ast: any, filePath: string) => {
  const importSpecifiers: ImportSpecifierInfo[] = [];

  // 遍历 AST 查找目标包的导入语句
  traverse(ast, {
    ImportDeclaration(path) {
      // 检查是否是从目标包导入
      if (path.node.source.value === TARGET_PACKAGE) {
        // 收集所有导入的标识符
        path.node.specifiers.forEach((specifier) => {
          if (t.isImportSpecifier(specifier)) {
            importSpecifiers.push({
              localName: specifier.local.name,
              importedName: (specifier.imported as t.Identifier)?.name || specifier.local.name,
            });
          }
        });

        // 生成注释文本
        const specifierNames = path.node.specifiers
          .filter((spec) => t.isImportSpecifier(spec))
          .map((spec) => (spec as t.ImportSpecifier).local.name)
          .join(', ');

        if (specifierNames) {
          // 创建注释文本
          const commentText = ` import { ${specifierNames} } from '${TARGET_PACKAGE}';`;

          // 使用正确的方式添加注释
          if (!path.node.leadingComments) {
            path.node.leadingComments = [];
          }

          path.node.leadingComments.push({
            type: 'CommentLine',
            value: commentText,
          } as any);
        }

        // 删除原导入语句
        path.remove();
      }
    },
  });

  // 如果找到了目标导入，则替换 JSX 中的使用
  if (importSpecifiers.length > 0) {
    traverse(ast, {
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        if (t.isJSXIdentifier(openingElement.name)) {
          const componentName = openingElement.name.name;
          // 检查是否是目标包中导入的组件
          if (importSpecifiers.some((spec) => spec.localName === componentName)) {
            // 创建一个空的 Fragment: <></>
            const fragment = t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), []);
            // 替换整个 JSX 元素
            path.replaceWith(fragment);
          }
        }
      },
    });
  }
};

const iconRefCleaner = (srcPath: string = '/Users/bytedance/Desktop/fe-monorepo/packages') => {
  try {
    const filePaths = getAllFilePaths(srcPath);
    const tsxFiles = filePaths.filter((file) => file.endsWith('.tsx') || file.endsWith('.jsx'));

    console.log(`找到 ${tsxFiles.length} 个 JSX/TSX 文件`);

    handleTsxFilesByAst(tsxFiles, handleCode);

    console.log('✅ 图标引用清理完成');
  } catch (error) {
    console.error('❌ 图标引用清理失败:', error);
  }
};

export default iconRefCleaner;
