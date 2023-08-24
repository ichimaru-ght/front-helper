const esbuild = require('esbuild');
const esbuildPluginTsc = require('esbuild-plugin-tsc');
const process = require('child_process');

const settings = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  external: ['shelljs'],
  platform: 'node',
  plugins: [
    esbuildPluginTsc({
      force: true,
    }),
  ],
  minify: true,
};

process.exec('rm -rf dist');
esbuild.build(settings).then((res) => {
  console.log('打包成功', res);
});
