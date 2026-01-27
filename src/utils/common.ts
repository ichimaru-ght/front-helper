import fs from 'fs';

export const logger = (content: string) => {
  fs.appendFileSync('logger.txt', `\n========= \n`);
  fs.appendFileSync('logger.txt', content);
};
