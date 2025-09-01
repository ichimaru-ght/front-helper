import path from 'path';
import { getAllFilePaths } from '../utils';
import Progress from 'progress';
import colors from '@colors/colors';
import fs from 'fs';

async function processImage(inputAbsolutePath: string, options: any = {}) {
  const globalSharpPath = require('child_process').execSync('npm root -g').toString().trim();
  const sharp = require(path.join(globalSharpPath, 'sharp'));
  // 合并默认配置和用户选项
  const { maxWidth = 1280, maxHeight = 720, quality = 80, forceWebp = true } = options;

  // 验证输入文件是否存在
  if (!fs.existsSync(inputAbsolutePath)) {
    throw new Error(`文件不存在: ${inputAbsolutePath}`);
  }

  // 解析输入路径信息
  const inputDir = path.dirname(inputAbsolutePath);
  const inputFileName = path.basename(inputAbsolutePath);
  const fileNameWithoutExt = path.parse(inputFileName).name;
  const originalExt = path.extname(inputFileName).toLowerCase();

  // 处理输出格式和文件名
  const outputExt = forceWebp ? '.webp' : originalExt;
  const outputFileName = `${fileNameWithoutExt}Cmp${outputExt}`;
  const outputAbsolutePath = path.join(inputDir, outputFileName);

  // 读取图片元数据
  const metadata = await sharp(inputAbsolutePath).metadata();
  const { width: originalWidth, height: originalHeight } = metadata;
  const isSmallImage = originalWidth <= maxWidth && originalHeight <= maxHeight;

  // 计算合理的质量参数（根据图片是否需要缩放动态调整）
  const effectiveQuality = isSmallImage
    ? Math.min(quality, 70) // 小图适当降低质量，避免体积变大
    : Math.min(quality, 85); // 大图保留较高质量

  // 处理图片
  const sharpInstance = sharp(inputAbsolutePath);

  // 如果需要缩放（超过720P）
  if (!isSmallImage) {
    // 计算等比例缩放后的尺寸
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const scaleRatio = Math.min(widthRatio, heightRatio);
    const newWidth = Math.round(originalWidth * scaleRatio);
    const newHeight = Math.round(originalHeight * scaleRatio);

    // 保持物理尺寸不变（调整像素密度）
    const originalDensity = metadata.density || 72;
    const originalPhysicalWidth = originalWidth / originalDensity;
    const newDensity = newWidth / originalPhysicalWidth;

    sharpInstance
      .resize(newWidth, newHeight, {
        kernel: 'lanczos3', // 高质量缩放算法
        fit: 'inside',
        withoutEnlargement: true,
      })
      .withMetadata({
        density: newDensity,
        orientation: metadata.orientation,
      });
  }

  // 根据输出格式设置最佳压缩参数
  if (outputExt === '.webp') {
    await sharpInstance
      .webp({
        quality: effectiveQuality,
        lossless: effectiveQuality >= 90, // 高质量时启用无损压缩
        alphaQuality: 80,
      })
      .toFile(outputAbsolutePath);
  } else if (outputExt === '.png') {
    await sharpInstance
      .png({
        quality: effectiveQuality,
        compressionLevel: 9, // 最高压缩级别
        adaptiveFiltering: true,
        palette: metadata.channels === 1, // 单色图使用调色板优化
      })
      .toFile(outputAbsolutePath);
  } else {
    // JPG/JPEG等格式
    await sharpInstance
      .jpeg({
        quality: effectiveQuality,
        progressive: true, // 渐进式加载，压缩效率更高
        chromaSubsampling: '4:2:0', // 合理的色彩子采样
        optimizeCoding: true,
      })
      .toFile(outputAbsolutePath);
  }

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

const imagProcess = (path: string) => {
  const files = getAllFilePaths(path);
  const picFiles = files.filter((file) => file.endsWith('.jpg'));
  const filtedFiles = picFiles.filter((file) => file.indexOf('Cmp') === -1);

  handlePicFiles(filtedFiles);
};

export default imagProcess;
