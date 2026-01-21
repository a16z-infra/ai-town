const webpack = require('webpack')
module.exports = function (config) {
   const configuration = {
    browserNoActivityTimeout: 120000,
    frameworks: ['mocha'],
    files: [
      './build/src/*.spec.js'
    ],
    preprocessors: {
      './build/src//*.spec.js': ['webpack', 'env']
    },
    webpack : {
      mode: "production",
      devtool: 'inline-source-map',
      module: {
          // Suppress warning from mocha: "Critical dependency: the request of a dependency is an expression"
          // @see https://webpack.js.org/configuration/module/#module-contexts
          exprContextCritical: false
      },
      // Suppress fatal error: Cannot resolve module 'fs'
      // @relative https://github.com/pugjs/pug-loader/issues/8
      // @see https://github.com/webpack/docs/wiki/Configuration#node
      node: {
        fs: 'empty',
        bindings: 'empty'
      }, 
      resolve: {
        extensions: ['.ts', '.js', '.json']
      }, plugins: [ new webpack.NormalModuleReplacementPlugin(
          /\.\/index/,
          './build/src/bromwser.js'
        ),
      ],
    },
    singleRun: true,
    reporters: ['mocha'],
    plugins: [
      'karma-chrome-launcher',
      'karma-env-preprocessor',
      'karma-webpack',
      'karma-mocha',
      'karma-mocha-reporter'
    ],
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    browsers: ['Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
   };

    if(process.env.TRAVIS) {
      configuration.browsers = ['Chrome_travis_ci'];
    }

    config.set(configuration);
}

