const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AwesomeTypescriptLoader = require('awesome-typescript-loader');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Phaser3 Simple RPG',
      template: './src/index.html',
    }),
    new CopyWebpackPlugin([{ from: 'assets', to: 'assets' }]),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
};
