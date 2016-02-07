#!/usr/bin/env babel-node

import glob from 'glob';
import path from 'path';
import fs from 'fs';
import Promise from 'songbird';
import { find, write } from './lib/file';

const sortKeys = obj => {
  const results = {};
  Object.keys(obj).sort().forEach(key => results[key] = obj[key]);
  return results;
}

const unique = arr => arr.reduce(
  (p, c) => {
    if (p.indexOf(c) < 0) p.push(c);
    return p;
  }, []
);

find('../brush-!(base)/package.json')
  .then(files => Promise.all(
    files.map(file =>
      fs.promise.readFile(`${path.dirname(file.fullpath)}/README.md`, 'utf8')
        .then(readme => readme.match(/^([\w\/]+) brush module/m)[1])
        .then(humanBrushName => {
          const json = JSON.parse(file.content);

          console.log(humanBrushName);

          json.keywords.push(json.name.replace('brush-', ''));
          json.keywords = unique(json.keywords);

          json.description = json.description.replace(/^[\w\/]+ brush module/, `${humanBrushName} brush module`);

          json.scripts = {
            "test": "babel-node node_modules/.bin/_mocha --opts mocha.opts test.js"
          };

          json.devDependencies["babel-cli"] = "^6.4.5";
          delete json.devDependencies["babel-register"];

          json.devDependencies = sortKeys(json.devDependencies);
          json.dependencies = sortKeys(json.dependencies);

          file.content = JSON.stringify(json, null, 2);
        })
        .then(() => write(file))
    )
  ));

find('../brush-!(base)/babel.js')
  .then(files => Promise.all(
    files.map(file => fs.promise.unlink(file.fullpath))
  ));

find('../brush-!(base)/mocha.opts')
  .then(files => Promise.all(
    files.map(file =>
      Promise.resolve()
        .then(() => file.content = file.content.replace(/--compilers js:babel\n/, ''))
        .then(() => write(file))
    )
  ));
