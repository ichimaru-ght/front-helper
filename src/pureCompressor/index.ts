import path from 'path';
import { getAllFilePaths } from '../utils';
import Progress from 'progress';
import colors from '@colors/colors';

const handlePicFiles = async (picFiles: string[]) => {
  const globalSharpPath = require('child_process').execSync('npm root -g').toString().trim();
  const sharp = require(path.join(globalSharpPath, 'sharp'));

  const bar = new Progress(colors.brightBlue('正在处理图片文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: picFiles.length,
  });

  for (const pic of picFiles) {
    await sharp(pic).avif({ quality: 90 }).toFile(pic.replace('.png', '.avif'));
    bar.tick(1);
  }
};

const pureCompressor = (path: string) => {
  const files = getAllFilePaths(path);
  const picFiles = files.filter((file) => file.endsWith('.png'));

  handlePicFiles(picFiles);
};

export default pureCompressor;
