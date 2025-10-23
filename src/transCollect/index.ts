import path from 'path';
import { getAllFilePaths, handleTsxFilesByAst, handleTsxFilesByCode } from '../utils';
import j from 'jscodeshift';
import fs from 'fs';
import XLSX from 'xlsx';

export let messages: Record<string, string> = {};

const handleCode = (ast: any, filePath: string) => {
  const root = j(ast);
  root
    .find(j.CallExpression, {
      callee: { name: 't' }, // 匹配函数名为 t 的调用
    })
    .forEach((path) => {
      const args = path.node.arguments;
      if (args.length < 2) return; // 确保有两个参数（key 和 options）

      // 提取第一个参数（key）：必须是字符串字面量
      const keyNode = args[0];
      if (keyNode.type !== 'StringLiteral') return;
      const key = keyNode.value;

      // 提取第二个参数中的 defaultValue：必须是对象字面量且包含 defaultValue 属性
      const optionsNode = args[1];
      if (optionsNode.type !== 'ObjectExpression') return;

      const defaultValueProp = optionsNode.properties.find(
        (prop: any) => prop.key?.name === 'defaultValue' && prop.value.type === 'StringLiteral',
      );
      if (!defaultValueProp) return;

      const defaultValue = defaultValueProp.value.value;

      // 存入 messages 对象（去重，保留最后一次出现的值）
      messages[key] = defaultValue;
    });
};

const writeMessagesToFile = (outputPath = 'translations.xlsx') => {
  try {
    // 转换 messages 为 Excel 行数据（第一行为表头，后续为内容）
    const excelData = [
      ['key', 'EN', 'ID'], // 表头
      ...Object.entries(messages).map(([key, defaultValue]) => [
        key, // 第一列：key
        defaultValue, // 第二列：默认值
        '', // 第三列：译文（置空）
      ]),
    ];

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData); // 将数组转换为工作表

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '翻译表'); // 工作表名称为“翻译表”

    // 确保输出目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入 Excel 文件
    XLSX.writeFile(workbook, outputPath);
    console.log(`✅ 翻译信息已写入 Excel：${path.resolve(outputPath)}`);
  } catch (err) {
    console.error('❌ 写入 Excel 失败：', err);
  }
};

const transCollect = (path = 'src') => {
  const paths = ['mm-task-detail', 'mm-task-list', 'mm-task-history-detail'];
  /*   const filePaths = getAllFilePaths(path); */
  const filterPaths = paths.map((item) => getAllFilePaths(item)).flat();
  const tsxFiles = filterPaths.filter((file) => file.endsWith('.tsx'));
  console.log('filterPaths', tsxFiles);
  handleTsxFilesByAst(tsxFiles, handleCode);
  writeMessagesToFile();
};

export default transCollect;
