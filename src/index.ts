#!/usr/bin/env node

import { getAllFilePaths } from './file';
import fs from 'fs';

const logger = (content: string) => {
  fs.appendFileSync('src/logger.txt', `\n========= \n`);
  fs.appendFileSync('src/logger.txt', content);
};

const main = () => {
  fs.writeFileSync('src/logger.txt', '');

  const files = getAllFilePaths('srcTest');
  const svgFiles = files.filter((file) => file.endsWith('.svg'));
  const tsxFiles = files.filter((file) => file.endsWith('.tsx'));

  logger(svgFiles.join(`\n`));
  logger(tsxFiles.join(`\n`));
};

main();
