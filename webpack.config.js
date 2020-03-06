const path = require('path');

const config = {
    mode: 'production',
    entry: './js/index.jsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    optimization: {
        // Disable UglifyJsPlugin because we don't care about bundle size and otherwise
        // it mangle UTF8 characters used as search icon in graphiql (and in codemirror)
        minimizer: [],
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: ['file?name=[name].[ext]'],
            },
            // for graphql module, which uses mjs still
            {
                type: 'javascript/auto',
                test: /\.mjs$/,
                use: [],
                include: /node_modules/,
            },
            {
                test: /\.(js|jsx)$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {modules: false}],
                                '@babel/preset-react',
                            ],
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.svg$/,
                use: [{loader: 'svg-inline-loader'}],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.json', '.jsx', '.css', '.mjs'],
    },
    performance: {
        maxEntrypointSize: 3000000,
        maxAssetSize: 3000000,
    },
};

module.exports = config;
