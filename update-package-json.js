#!/usr/bin/env babel-node

import glob from 'glob';
import path from 'path';
import Promise from 'songbird';
import { find, write } from './lib/file';

const updateDependencies = dependencies =>
  Object.keys(dependencies).forEach(key => {
    if (dependencies[key].indexOf('syntaxhighlighter/') === 0) {
      const name = dependencies[key].replace('syntaxhighlighter/', '');
      delete dependencies[key];
      dependencies[`@alexgorbatchev/${name}`] = '^4.0.0';
    }
  });

find('../!(xregexp|dev-tools|generator*)/package.json')
  .then(files => Promise.all(
    files.map(file =>
      Promise.resolve(JSON.parse(file.content))
        .then(json => {
          updateDependencies(json.devDependencies);
          updateDependencies(json.dependencies);
          file.content = JSON.stringify(json, null, 2);
        })
        .then(() => write(file))
    )
  ));
