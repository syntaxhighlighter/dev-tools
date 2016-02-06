#!/usr/bin/env babel-node

import glob from 'glob';
import path from 'path';
import Promise from 'songbird';
import { find, write } from './lib/file';

find('../{brush,theme}-*/README.md')
  .then(files => Promise.all(files.map(file => updateBrushReadme(file).then(write))));

const getFirstLine = content => content.split(/\n/mg)[2];
const getName = fullpath => fullpath.match(/(brush|theme)-(\w+)/)[0]

const updateBrushReadme = file => {
  const name = getName(file.fullpath);
  const firstLine = getFirstLine(file.content);

  file.content =
`# ${name}

[![GratiPay](https://img.shields.io/gratipay/user/alexgorbatchev.svg)](https://gratipay.com/alexgorbatchev/)
[![Build Status](https://travis-ci.org/syntaxhighlighter/${name}.svg)](https://travis-ci.org/syntaxhighlighter/${name})
![Downloads](https://img.shields.io/npm/dm/${name}.svg)
![Version](https://img.shields.io/npm/v/${name}.svg)

${firstLine}

## Installation

\`\`\`
npm install ${name}
\`\`\`

## Usage

Please see [SyntaxHighlighter](https://github.com/syntaxhighlighter/syntaxhighlighter) for usage instructions.

## Testing

\`\`\`
npm test
\`\`\`

## License

MIT
`;

  return Promise.resolve(file);
}