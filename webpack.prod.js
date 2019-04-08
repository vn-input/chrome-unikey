var webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: {
		main: './src/index.js',
		options: './src/options/options.js',
	},
	module: {
		rules: [
			{
				test: /\.(scss)$/,
				use: [{
					loader: 'style-loader', // inject CSS to page
				}, {
					loader: 'css-loader', // translates CSS into CommonJS modules
				}, {
					loader: 'postcss-loader', // Run post css actions
					options: {
						plugins: function () { // post css plugins, can be exported to postcss.config.js
							return [
								require('precss'),
								require('autoprefixer')
							];
						}
					}
				}, {
					loader: 'sass-loader' // compiles Sass to CSS
				}]
			},
		]
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery",
		})
	],
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: true,
					},
				},
			}),
		],
	},
}
