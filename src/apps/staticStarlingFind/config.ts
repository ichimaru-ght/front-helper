import { CommonConfig } from '../../typings';

export const config: CommonConfig = {
  defaultSrc: 'src',
  pathFilter: (path: string) => path.endsWith('.tsx') || path.endsWith('.jsx'),
};
