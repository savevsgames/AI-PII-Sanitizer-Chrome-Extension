const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/serviceWorker.ts',
    content: './src/content/content.ts',
    popup: './src/popup/popup.ts',
    'popup-v2': './src/popup/popup-v2.ts',
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
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/popup/popup-v2.html', to: 'popup-v2.html' },
        { from: 'src/popup/popup-v2.css', to: 'popup-v2.css' },
        { from: 'src/assets/icons', to: 'icons' },
        { from: 'src/content/inject.js', to: 'inject.js' },
      ],
    }),
  ],
  devtool: false, // Disable source maps to avoid CSP issues
};
