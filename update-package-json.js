#!/usr/bin/env babel-node

import glob from 'glob';
import path from 'path';
import Promise from 'songbird';
import { find, write } from './lib/file';

// find('../*apple*/package.json')
find('../!(xregexp|dev-tools|generator*)/package.json')
  .then(files => Promise.all(
    files.map(file =>
      Promise.resolve(JSON.parse(file.content))
        .then(json => {
          if (json.name.indexOf('gorbatchev') === -1) {
            json.name = `@alexgorbatchev/${json.name}`;
            file.content = JSON.stringify(json, null, 2);
          }
        })
        .then(() => write(file))
    )
  ));
