const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    background: './src/background/serviceWorker.ts',
    content: './src/content/content.ts',
    'popup-v2': './src/popup/popup-v2.ts',
    auth: './src/auth/auth.ts',
    'document-preview': './src/document-preview.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new Dotenv({
      path: './.env',
      safe: false,
      systemvars: true,
      defaults: false,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup-v2.html', to: 'popup-v2.html' },
        { from: 'src/popup/popup-v2.css', to: 'popup-v2.css' },
        { from: 'src/popup/styles', to: 'styles' }, // Copy modular CSS
        { from: 'src/popup/assets', to: 'assets' }, // Copy background images
        { from: 'src/auth/auth.html', to: 'auth.html' }, // Auth page
        { from: 'src/document-preview.html', to: 'document-preview.html' }, // Document preview page
        { from: 'src/document-preview.css', to: 'document-preview.css' }, // Document preview CSS
        { from: 'src/assets/icons', to: 'icons' },
        { from: 'src/content/inject.js', to: 'inject.js' },
        { from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs', to: 'pdf.worker.min.mjs' }, // PDF.js worker
      ],
    }),
  ],
  devtool: 'inline-source-map', // Enable for debugging
};
