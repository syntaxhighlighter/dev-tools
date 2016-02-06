#!/usr/bin/env babel-node

import glob from 'glob';
import path from 'path';
import Promise from 'songbird';
import { find, write } from './lib/file';

const updateDependencies = (dependencies = {}) =>
  Object.keys(dependencies).forEach(key => {
    if (key.indexOf('') === 0) {
      const newKey = key.replace('', '');
      const value = dependencies[key];
      delete dependencies[key];
      dependencies[newKey] = value;
    }
  });

find('../!(xregexp|dev-tools|generator*)/package.json')
  .then(files => Promise.all(
    files.map(file =>
      Promise.resolve(JSON.parse(file.content))
        .then(json => {
          if (json.name) {
            json.name = json.name.replace('', '');
          }

          updateDependencies(json.devDependencies);
          updateDependencies(json.dependencies);
          file.content = JSON.stringify(json, null, 2);
        })
        .then(() => write(file))
    )
  ));
