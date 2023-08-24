import fs from 'fs';
import path from 'path';

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
    /*  if (filePath.endsWith('.tsx')) {
      paths.push(filePath);
    } */
    paths.push(filePath);
  });
  return paths;
};
