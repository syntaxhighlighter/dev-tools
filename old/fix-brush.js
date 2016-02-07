#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var decaffeinate = require('decaffeinate');
var beautify = require('js-beautify').js_beautify;

function replaceOrDie(src, needle, value) {
  var results = src.replace(needle, value);
  if (results === src) {
    throw new Error('Failed to replace ' + needle.toString());
  }
  return results;
}

function coffee2js(filepath) {
  var src = fs.readFileSync(filepath, 'utf8');

  src = src
    .replace(')\n  .SyntaxHighlighter', ').SyntaxHighlighter')
    .replace('require \'coffee-errors\'\n', '')
    ;

  src = beautify(decaffeinate.convert(src), { indent_size: 2 });

  fs.writeFileSync(filepath.replace('spec.coffee', 'test.js'), src);
}

function fixBrush() {
  var files = glob.sync('lib/brush-*.js');
  var src = fs.readFileSync(files[0], 'utf8');

  src = replaceOrDie(src, ';(function()\n{\n', '');
  src = replaceOrDie(src, /\}\)\(\);\n?$/, '');
  src = replaceOrDie(src, /^\s*\/\/ CommonJS\n/gm, '');
  src = replaceOrDie(src, 'typeof(exports) != \'undefined\' ? exports.Brush = Brush : null;', 'exports.Brush = Brush;');
  src = replaceOrDie(src, /^\s*SyntaxHighlighter\.brushes\.\w+ = Brush;\n/m, '');
  src = replaceOrDie(src, "SyntaxHighlighter = SyntaxHighlighter || (typeof require !== 'undefined'? require('shCore').SyntaxHighlighter : null);", "var BrushBase = require('brush-base');\nvar regexLib = require('syntaxhighlighter-regex').commonRegExp;");
  src = replaceOrDie(src, /\bSyntaxHighlighter.Highlighter\b/g, 'BrushBase');
  src = replaceOrDie(src, 'exports.Brush = Brush;', 'module.exports = Brush;');
  src = src.replace(/\bSyntaxHighlighter.regexLib\b/g, 'regexLib');
  src = src.replace(/\}(,?)\s*\/\/.*$/gm, '}$1');
  src = beautify(src, { indent_size: 2, keep_array_indentation: true });

  if (src[0] === ' ' && src[1] === ' ') src = src.replace(/^  /gm, '');
  if (src[0] === '\t') src = src.replace(/^\t/gm, '');

  fs.unlinkSync(files[0]);
  fs.rmdirSync('lib');
  fs.writeFileSync('brush.js', src);
}

function fixTests() {
  var files = glob.sync('test/*.test.js');
  var src = fs.readFileSync(files[0], 'utf8');

  src = replaceOrDie(src, "var fs = require('fs');\n", '');
  src = replaceOrDie(src, "var {\n  Brush\n} = require('..');", "var Brush = require('.');");
  src = replaceOrDie(src, /\bSAMPLE\b/g, 'sample');
  src = replaceOrDie(src, "var sample = fs.readFileSync(`${__dirname}/../sample`, 'utf8');\nconsole.log(sample);", "var sample = require('raw!./sample.txt');");
  src = replaceOrDie(src, "(typeof window !== 'undefined' && window || global).SyntaxHighlighter = {\n", '');
  src = replaceOrDie(src, "  Highlighter: require('brush-base'),\n", '');
  src = replaceOrDie(src, "  regexLib: require('regex-lib'),\n", '');
  src = replaceOrDie(src, "  brushes: {}\n", '');
  src = replaceOrDie(src, "};\n", '');

  fs.unlinkSync('test/shcore-stub.js');
  fs.unlinkSync(files[0]);
  fs.rmdirSync('test');
  fs.writeFileSync('test.js', src);
}

function fixKarmaConf() {
  fs.writeFileSync('karma.conf.js', fs.readFileSync(__dirname + '/template-brush-karma.conf.js', 'utf8'));
}

function fixSample() {
  fs.writeFileSync('sample.txt', fs.readFileSync('SAMPLE', 'utf8'));
  fs.unlinkSync('SAMPLE');
}

function fixPackageJSON() {
  var packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  delete packageJson.browser;

  packageJson.main = 'brush.js';
  packageJson.babel = { presets: ['es2015'] };
  packageJson.scripts.test = 'karma start --single-run';

  packageJson.dependencies = {
    "brush-base": "syntaxhighlighter/brush-base",
    "regex-lib": "syntaxhighlighter/regex-lib",
  };

  packageJson.devDependencies = {
    "parser": "syntaxhighlighter/parser",
    "chai": "^3.4.1",
    "babel-core": "^6.1.21",
    "babel-preset-es2015": "^6.1.18",
    "babel-loader": "^6.2.0",
    "webpack": "^1.9.6",
    "raw-loader": "^0.5.1",
    "karma": "^0.13.14",
    "karma-mocha": "^0.2.0",
    "karma-phantomjs-launcher": "^0.2.1",
    "karma-mocha-reporter": "^1.0.2",
    "karma-sourcemap-loader": "^0.3.6",
    "karma-webpack": "^1.7.0",
  };

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

function updateTravis() {
  var src = fs.readFileSync('.travis.yml', 'utf8');
  src = src.replace('  - "0.10"\n\n', '  - "0.10"\n  - "0.12"\n  - "4"\n\n');
  fs.writeFileSync('.travis.yml', src);
}

function removeFiles() {
  fs.unlinkSync('Gruntfile.coffee');
  fs.unlinkSync('karma.conf.coffee');
}

function convertCoffeeFiles() {
  var files = glob.sync('{lib,test}/*.coffee');
  files.map(coffee2js);
  files.map(fs.unlinkSync);
}

convertCoffeeFiles();
fixBrush();
fixTests();
fixKarmaConf();

removeFiles();
fixSample();
fixPackageJSON();
updateTravis();
