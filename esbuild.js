const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: !isProduction,
  minify: isProduction,
};

const webviewConfig = {
  entryPoints: ['src/webview/main.tsx'],
  bundle: true,
  outfile: 'dist/webview/main.js',
  format: 'iife',
  platform: 'browser',
  sourcemap: !isProduction,
  minify: isProduction,
  loader: {
    '.ts': 'tsx'
  }
};

async function build() {
  try {
    if (isWatch) {
      console.log('[watch] build started');
      esbuild.context(extensionConfig).then(ctx => ctx.watch());
      esbuild.context(webviewConfig).then(ctx => ctx.watch());
    } else {
      console.log('[build] build started');
      await esbuild.build(extensionConfig);
      await esbuild.build(webviewConfig);
      console.log('[build] finished');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

build();