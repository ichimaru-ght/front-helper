import path from 'path';
import fs from 'fs';

const CONFIG_PATH = 'front-helper.config.js';

export const getLocalConfig = () => {
  const configPath = path.join(process.cwd(), CONFIG_PATH);

  if (!fs.existsSync(configPath)) {
    return {};
  }
  const config = require(configPath);

  return config;
};
