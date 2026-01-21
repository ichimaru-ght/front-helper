import Progress from 'progress';
import colors from '@colors/colors';

import { getAllFilePaths } from '../../utils';
import { config } from './config';

const processFile = async (inputAbsolutePath: string) => {
  // your logic here
};

const handleFiles = async (files: string[]) => {
  const bar = new Progress(colors.brightBlue('正在处理图片文件 [:bar] :current/:total :percent'), {
    complete: '+',
    incomplete: '.',
    width: 20,
    total: files.length,
  });

  for (const file of files) {
    await processFile(file);
    bar.tick(1);
  }
};

const tool = (path: string) => {
  const finalPath = path || config.defaultSrc;
  if (finalPath) {
    console.log('没有有效路径');
  }
  const files = getAllFilePaths(finalPath);
  let picFiles = files.filter((file) => config.pathFilter?.(file));
  console.log('tool execute files', picFiles);

  handleFiles(picFiles);
};

export default tool;
