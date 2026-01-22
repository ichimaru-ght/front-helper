import path from 'path';

import Progress from 'progress';
import colors from '@colors/colors';
import fs from 'fs';
import { getAllFilePaths, getFilePathInfo } from '../../utils';
import { config } from './config';

/* const toAvif = async (sharp: any, pic: string) => {
  const newPath = pic.replace('.jpg', '.avif').replace('.png', '.avif').replace('.jpeg', '.avif');
  await sharp(pic)
    .avif({
      encoder: 'svt',
      quality: 50,
      speed: 3,
    })
    .toFile(newPath);
};

const toWebp = async (sharp: any, pic: string) => {
  const newPath = pic.replace('.jpg', '.webp').replace('.png', '.webp').replace('.jpeg', '.webp')
  await sharp(pic).webp({ quality: 70 }).toFile(newPath);
}; */

async function processImage(inputAbsolutePath: string) {
  const globalSharpPath = require('child_process').execSync('npm root -g').toString().trim();
  const sharp = require(path.join(globalSharpPath, 'sharp'));

  if (!sharp) {
    throw new Error(`sharp 未安装，请先npm install sharp -g包`);
  }

  if (!fs.existsSync(inputAbsolutePath)) {
    throw new Error(`文件不存在: ${inputAbsolutePath}`);
  }

  const pathInfo = getFilePathInfo(inputAbsolutePath);
  const outputAbsolutePath = config.pathGenerator?.(pathInfo) || inputAbsolutePath;

  const sharpInstance = sharp(inputAbsolutePath);
  await sharpInstance
    .webp({
      quality: config.quality,
      alphaQuality: 80,
    })
    .toFile(outputAbsolutePath);

  return outputAbsolutePath;
}

const handlePicFiles = async (picFiles: string[]) => {
  const bar = new Progress(colors.brightBlue('正在处理图片文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: picFiles.length,
  });

  for (const pic of picFiles) {
    await processImage(pic);
    bar.tick(1);
  }
};

/** 处理图片压缩，修改成webp格式 */
const webpCompress = (path: string) => {
  const finalPath = path || config.defaultSrc;
  if (finalPath) {
    console.log('没有有效路径');
  }
  const files = getAllFilePaths(finalPath);
  let picFiles = files.filter((file) => config.pathFilter?.(file));
  console.log('picFiles', picFiles);

  handlePicFiles(picFiles);
};

export default webpCompress;
