const paths = require('./paths');

module.exports = {
    entry: paths.src + '/screen-scrolling-js.js',
    output: {
        path: paths.build,
        filename: 'screen-scrolling-js.js',
        library: 'screen-scrolling-js',
        libraryTarget: 'umd',
    },
    plugins: [],
    module: {
        rules: [
            {test: /\.js$/, exclude: /node_modules/, use: ['babel-loader']},
        ],
    }
};
