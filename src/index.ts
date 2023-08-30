#!/usr/bin/env node
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
  program.parse(process.argv);
};

main();
