const esbuild = require('esbuild');
const esbuildPluginTsc = require('esbuild-plugin-tsc');
const process = require('child_process');

const onBuildTip = {
  name: 'onBuildTip',
  setup(build) {
    build.onStart(() => {
      console.log('Triggered, start building...');
    });
    build.onEnd(() => {
      console.log('Building Done\n');
    });
  },
};

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
    onBuildTip,
  ],
  sourcemap: true,
};

const dev = async () => {
  process.exec('rm -rf dist');
  const ctx = await esbuild.context(settings);
  ctx.watch();
  process.exec('npm link', (err, stdout) => {
    if (err) {
      console.log('npm link error');
      console.log(err);
    } else {
      console.log('npm link success');
      console.log(stdout);
    }
  });
};

dev();
