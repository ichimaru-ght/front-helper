import fs from 'fs';
import path from 'path';
import { FilePathInfo } from '../typings';

const walkSync = (currentDirPath: string, callback: (filePath: string, dirent: string) => void) => {
  fs.readdirSync(currentDirPath, { withFileTypes: true }).forEach(function (dirent: any) {
    var filePath = path.join(currentDirPath, dirent.name);
    if (dirent.isFile()) {
      callback(filePath, dirent);
    } else if (dirent.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
};

export const getAllFilePaths = (startPath: string) => {
  const paths: string[] = [];
  walkSync(startPath, function (filePath) {
    paths.push(filePath);
  });
  return paths;
};

/**
 * 分割文件路径
 * @param filePath 文件路径
 * @returns 分割后的文件路径对象
 */
export const getFilePathInfo: (filePath: string) => FilePathInfo = (filePath: string) => {
  const inputDir = path.dirname(filePath);
  const inputFileName = path.basename(filePath);
  const fileNameWithoutExt = path.parse(inputFileName).name;

  const originalExt = path.extname(inputFileName).toLowerCase();
  return {
    dir: inputDir,
    fileName: inputFileName,
    fileNameWithoutExt,
    fileExtension: originalExt,
  };
};
