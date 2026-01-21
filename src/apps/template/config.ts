import path from 'path';
import { CommonConfig, FilePathInfo } from '../../typings';

export const config: CommonConfig = {
  defaultSrc: 'assets',
  pathFilter: (path: string) => path.endsWith('.tsx'),
  pathGenerator: (info: FilePathInfo) => {
    const { dir: inputDir, fileNameWithoutExt } = info;
    const outputFileName = `${fileNameWithoutExt}Cmp.webp`;
    return path.join(inputDir, outputFileName);
  },
  quality: 80,
};
