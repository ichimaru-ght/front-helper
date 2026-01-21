import path from 'path';
import { getAllFilePaths } from '../utils';
import Progress from 'progress';
import colors from '@colors/colors';

const toWebp = async (sharp: any, pic: string) => {
  const newPath = pic.replace('.jpg', '.webp').replace('.png', '.webp').replace('.jpeg', '.webp');
  /*    .replace('images', 'images/Cmp'); */
  await sharp(pic).webp({ quality: 70 }).toFile(newPath);
};

const toAvif = async (sharp: any, pic: string) => {
  const newPath = pic.replace('.jpg', '.avif').replace('.png', '.avif').replace('.jpeg', '.avif');
  await sharp(pic)
    .avif({
      encoder: 'svt',
      quality: 50,
      speed: 3,
    })
    .toFile(newPath);
};

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
    toAvif(sharp, pic);
    bar.tick(1);
  }
};

const pureCompressor = (path: string) => {
  const files = getAllFilePaths(path);
  const picFiles = files
    .filter((file) => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
    ?.filter((file) => file.indexOf('image_') !== -1);

  handlePicFiles(picFiles);
};

export default pureCompressor;
