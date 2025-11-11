const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

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
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
          transform(content) {
            // Parse the manifest
            const manifest = JSON.parse(content.toString());

            // Inject the public key from environment variable
            // This ensures all testers get the same extension ID
            if (process.env.EXTENSION_PUBLIC_KEY) {
              manifest.key = process.env.EXTENSION_PUBLIC_KEY;
              console.log('✓ Injected EXTENSION_PUBLIC_KEY into manifest.json');
              console.log('✓ Extension ID will be: gpmmdongkfeimmejkbcnilmacgngnjgi');
            } else {
              console.warn('⚠️  EXTENSION_PUBLIC_KEY not found in .env');
              console.warn('⚠️  Extension ID will be random (different per machine)');
            }

            return JSON.stringify(manifest, null, 2);
          }
        },
        { from: 'src/popup/popup-v2.html', to: 'popup-v2.html' },
        { from: 'src/popup/popup-v2.css', to: 'popup-v2.css' },
        { from: 'src/popup/styles', to: 'styles' }, // Copy modular CSS
        { from: 'src/popup/assets', to: 'assets' }, // Copy background images
        { from: 'src/auth/auth.html', to: 'auth.html' }, // Auth page
        { from: 'src/document-preview.html', to: 'document-preview.html' }, // Document preview page
        { from: 'src/document-preview.css', to: 'document-preview.css' }, // Document preview CSS
        { from: 'src/document-preview-progress.css', to: 'document-preview-progress.css' }, // Progress bar CSS
        { from: 'src/assets/icons', to: 'icons' },
        { from: 'src/content/inject.js', to: 'inject.js' },
        { from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs', to: 'pdf.worker.min.mjs' }, // PDF.js worker
      ],
    }),
  ],
  devtool: 'inline-source-map', // Enable for debugging
};
