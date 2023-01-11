const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const manifest = require('../manifest.json');

const srcDir = path.resolve(__dirname, 'src');
const title = 'LOA'
const version = manifest.version

module.exports = {
   mode: "production",
   context: srcDir,
   entry: {},
   output: {path: path.join(__dirname, "../dist/source"),},
   plugins: [
      new CopyPlugin({
         patterns: [
            {from: "**/*", context: path.resolve(__dirname, ".."),
               globOptions: {
                  gitignore: true
               }
            },{from: ".gitignore", context: path.resolve(__dirname, "..")}
      ]}),

       new ZipPlugin({
         path: path.join(__dirname, "../dist"),
         filename: `${title}_${version}_src.zip`
       }),

       new RemovePlugin({
         after: {
             include: ['./dist/source'],
             trash: true
         }
     })
   ],
};