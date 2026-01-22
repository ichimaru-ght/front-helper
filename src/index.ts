#!/usr/bin/env node
import svgRestrain from './apps/svgRestrain';
import { program } from 'commander';
import staticStarlingFind from './apps/staticStarlingFind';
import intlReset from './apps/intlReset';
import webpCompress from './apps/webpCompress';

const main = () => {
  program.version('0.0.1').option('-P --path <path>', 'root path', 'src');

  program
    .command('svg')
    .description('run svg tide up')
    .action(function (res) {
      const { path } = program.opts();
      svgRestrain(path);
    });

  program
    .command('intlReset')
    .description('remove unused import declaration')
    .action(function (res) {
      const { path } = program.opts();
      intlReset(path);
    });

  program
    .command('webp-compress')
    .description('remove unused import declaration')
    .action(function (res) {
      const { path } = program.opts();
      webpCompress(path);
    });

  program
    .command('static-starling')
    .description('remove unused import declaration')
    .action(function (res) {
      const { path } = program.opts();
      staticStarlingFind(path);
    });

  program.parse(process.argv);
};

main();
