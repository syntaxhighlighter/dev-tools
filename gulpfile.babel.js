import gulp from 'gulp';
import request from 'request';
import fs from 'fs';
import R from 'ramda';
import Promise from 'songbird';
import {exec} from 'child_process';

const PROJECTS_CACHE = `${__dirname}/.projects-cache.json`;

function loadReposFromGitHub() {
  const opts = {
    url: 'https://api.github.com/orgs/syntaxhighlighter/repos',
    json: true,
    headers: { 'User-Agent': 'node.js' },
  };

  return new Promise((resolve, reject) =>
    request(opts, (err, response) => {
      if (err) return reject(err);
      const json = response.body;
      fs.writeFile(PROJECTS_CACHE, JSON.stringify(json, null, 2));
      resolve(json);
    })
  );
}

const loadReposFromCache = () =>
  fs.readFile.promise(PROJECTS_CACHE, 'utf8')
    .then(JSON.parse);

const loadRepos = () =>
  loadReposFromCache()
    .error(loadReposFromGitHub)
    .then(R.map(R.pick(['ssh_url', 'name'])));

const git = (cmd, cwd) =>
  exec.promise(`git ${cmd}`, {cwd})
    .catch(err => { throw new Error(err.message + '\n\n' + cmd) });

const cloneRepo = R.curry(repo => {
  console.log(`Cloning: ${repo.ssh_url}`);
  return git(`clone '${repo.ssh_url}'`, `${__dirname}/src`);
});

const pathToRepo = repo => `${__dirname}/src/${repo.name}`;

const linkNodeModules = R.curry(repo =>
  exec.promise('ln -s ../../node_modules .', { cwd: pathToRepo(repo) })
    .catch(() => console.log(`${repo.name}: already has node_modules`))
);

const linkPackage = R.curry(repo =>
  exec.promise(`ln -s ${pathToRepo(repo)} ${__dirname}/node_modules`)
    .catch(() => console.log(`${repo.name}: is already linked`))
);

gulp.task('clone-repos', () =>
  loadRepos()
    .then(R.filter(repo => !fs.existsSync(pathToRepo(repo))))
    .then(R.map(cloneRepo))
    .then(Promise.all)
);

gulp.task('link-node_modules', ['clone-repos'], () =>
  loadRepos()
    .then(R.filter(repo => repo.name.match(/^(brush|theme)-/)))
    .then(R.map(linkNodeModules))
    .then(Promise.all)
);

gulp.task('link-packages', ['clone-repos'], () =>
  loadRepos()
    .then(R.map(linkPackage))
    .then(Promise.all)
);

gulp.task('default', ['clone-repos', 'link-node_modules', 'link-packages']);
