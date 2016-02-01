import fs from 'fs';
import path from 'path';
import glob from 'glob';
import Promise from 'songbird';

export const find = search =>
  glob.promise(search)
    .then(files =>
      Promise.all(
        files.map(filepath =>
          Promise.props({
            fullpath: path.resolve(process.cwd(), filepath),
            basepath: path.resolve(process.cwd(), path.dirname(filepath)),
            content: fs.promise.readFile(filepath, 'utf8'),
          })
        )
      )
    );

export const write = file =>
  fs.promise.writeFile(file.fullpath, file.content)
    .then(() => file);
