#!/usr/bin/env babel-node

import glob from 'glob';
import path from 'path';
import Promise from 'songbird';
import { find } from './lib/file';

find('../{brush,theme}-*/README.md')
  .then(files => files.map(addModule))
  .then(() => {
    console.log(modules.join('\n'));
  })

const modules = [];
const getName = fullpath => fullpath.match(/(brush|theme)-(\w+)/)[0]

const addModule = file => {
  const name = getName(file.fullpath);
  modules.push(`| [${name}](https://github.com/syntaxhighlighter/${name}) | [![Build Status](https://travis-ci.org/syntaxhighlighter/${name}.svg)](https://travis-ci.org/syntaxhighlighter/${name}) | ![Downloads](https://img.shields.io/npm/dm/${name}.svg) | ![Version](https://img.shields.io/npm/v/${name}.svg) |`);
}