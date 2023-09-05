import fs from 'fs';

export const logger = (content: string) => {
  fs.appendFileSync('src/logger.txt', `\n========= \n`);
  fs.appendFileSync('src/logger.txt', content);
};
