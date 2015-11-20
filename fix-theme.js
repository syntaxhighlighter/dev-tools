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

  src = beautify(decaffeinate.convert(src), { indent_size: 2 });
  fs.writeFileSync(filepath.replace('spec.coffee', 'test.js'), src);
}

function fixTheme() {
  var files = glob.sync('scss/theme*.scss');
  var src = fs.readFileSync(files[0], 'utf8');

  src = replaceOrDie(src, '@import "theme.scss";', '@import "theme-base.scss";')

  fs.writeFileSync('theme.scss', src);
  fs.unlinkSync(files[0]);
  fs.rmdirSync('scss');
}

function fixTests() {
  var files = glob.sync('test/theme*.test.js');
  var src = fs.readFileSync(files[0], 'utf8');
  var opts = fs.readFileSync('test/mocha.opts', 'utf8');

  src = replaceOrDie(src, /\/\.\.\/scss\/theme(-\w+)?\.scss/, '/theme.scss');
  src = replaceOrDie(src, 'var css = sass', 'var results = sass');
  src = replaceOrDie(src, /if.*typeof css !== "undefined".*\n.*\n\s+\}\n/m, 'if(!results.css.length) throw new Error("Expecting results");\n');
  src = src.replace(/return /g, '');
  src = src.replace(/\.\.\/node_modules\/theme-base\/scss/, 'node_modules/theme-base');

  opts = replaceOrDie(opts, 'coffee:coffee-script/register', 'js:babel-core/register');

  fs.writeFileSync('test.js', src);
  fs.writeFileSync('mocha.opts', opts);
  fs.unlinkSync('test/mocha.opts');
  fs.unlinkSync(files[0]);
  fs.rmdirSync('test');
}

function fixPackageJSON() {
  var packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  delete packageJson.scripts.prepublish;

  packageJson.main = 'theme.scss';
  packageJson.scripts.test = 'mocha --opts mocha.opts test.js';

  packageJson.dependencies = {
    "theme-base": "syntaxhighlighter/theme-base",
  };

  packageJson.devDependencies = {
    "node-sass": "^3.4.2",
    "mocha": "^2.3.4",
  };

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

function updateTravis() {
  var src = fs.readFileSync('.travis.yml', 'utf8');
  src = src.replace('  - "0.10"\n', '  - "0.10"\n  - "0.12"\n  - "4"\n');
  fs.writeFileSync('.travis.yml', src);
}

function convertCoffeeFiles() {
  var files = glob.sync('test/*.coffee');
  files.map(coffee2js);
  files.map(fs.unlinkSync);
}

function removeFiles() {
  fs.unlinkSync('Gruntfile.coffee');

  glob.sync('css/*.*').map(fs.unlinkSync);
  fs.rmdirSync('css');
}

convertCoffeeFiles();
fixTheme();
fixTests();

fixPackageJSON();
updateTravis();
removeFiles();
