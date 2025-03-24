#!/usr/bin/env node
import avifCompressor from './avifCompressor';
import removeUnusedImport from './removeUnusedImport';
import svgRestrain from './svgRestrain';
import { program } from 'commander';

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
    .command('importRemove')
    .description('remove unused import declaration')
    .action(function (res) {
      const { path } = program.opts();
      removeUnusedImport(path);
    });
  program
    .command('avif')
    .description('remove unused import declaration')
    .action(function (res) {
      avifCompressor();
    });
  program.parse(process.argv);
};

main();
