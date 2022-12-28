const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const Crx = require("crx-webpack-plugin");
const ZipPlugin = require('zip-webpack-plugin');

const outDir = path.resolve(__dirname, 'dist');
const srcDir = path.resolve(__dirname, 'src');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');
const title = 'LOA'

module.exports = {
   mode: "production",
   entry: {
      popup: path.resolve(__dirname, "..", "src", "popup/popup.ts"),
      content: path.resolve(__dirname, "..", "src", "content/content.ts"),
   },
   output: {
      path: path.join(__dirname, "../build"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js"],
      modules: [srcDir, 'node_modules', 'lib'],
   },
   module: {
      rules: [
         {
            test: /\.scss$/,
            exclude: /node_modules/,
            type: "asset/resource",
            generator: {
              filename: "[name].css",
            },
            use: ["sass-loader"],
          },
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            {from: "manifest.json", to: "manifest.json"},
            {from: "src/*/*.html", to: "[name].html"},
            {from: "**/*", to: "images", context: path.resolve(__dirname, "..", "images")}
   ]
      }),
      new Crx({
         keyFile: 'key.pem',
         contentPath: path.join(__dirname, "../build"),
         outputPath: path.join(__dirname, "../dist"),
         name: title
       }),

       new ZipPlugin({
         path: path.join(__dirname, "../dist"),
         filename: `${title}.zip`,
         extension: 'xpi',
       })
   ],
};