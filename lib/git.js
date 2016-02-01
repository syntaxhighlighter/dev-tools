import Promise from 'songbird';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const getDirFor = filepath =>
  Promise.resolve(path.resolve(process.cwd(), filepath))
    .then(filepath => fs.promise.stat(filepath))
    .then(stat => stat.isFile() ? path.dirname(filepath) : filepath)
    .catch(err => { throw err });

export const gitCmd = (cmd, gitDir) =>
  getDirFor(gitDir).then(gitDir =>
    exec.promise(`git ${cmd}`, { cwd: gitDir })
      .catch(err => { throw new Error(err.message + '\n\n' + cmd) })
  );

export const gitAdd = fullpath =>
  getDirFor(fullpath).then(gitDir =>
    gitCmd(`add ${JSON.stringify(path.relative(gitDir, fullpath))}`, gitDir)
  );

export const gitCommit = (message, cwd) => gitCmd(`commit -m ${JSON.stringify(message)}`, cwd);

export const gitPush = cwd => gitCmd('push', cwd);
