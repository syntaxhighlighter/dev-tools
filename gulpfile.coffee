gulp    = require 'gulp'
request = require 'request'
fs      = require 'fs'
R       = require 'ramda'
Promise = require 'songbird'
{exec}  = require 'child_process'

PROJECTS_CACHE = "#{__dirname}/.projects-cache.json"

loadReposFromGitHub = ->
  opts =
    url     : 'https://api.github.com/orgs/syntaxhighlighter/repos'
    json    : true
    headers : 'User-Agent': 'node.js'

  new Promise (resolve, reject) ->
    request opts, (err, response) ->
      return reject err if err?
      json = response.body
      fs.writeFile PROJECTS_CACHE, JSON.stringify json
      resolve json

loadReposFromCache = ->
  fs.readFile.promise PROJECTS_CACHE, 'utf8'
    .then JSON.parse

git = (cmd, cwd) ->
  exec.promise "git #{cmd}", {cwd}
    .spread (stdout, stderr) -> stdout.split /\n/g
    .catch (err) -> throw err.message + '\n\n' + cmd

cloneRepo = R.curry ({name, git_url: gitUrl}) ->
  console.log "Cloning: #{gitUrl}"
  git "clone '#{gitUrl}'", "#{__dirname}/.."

gulp.task 'setup', ->
  loadReposFromCache()
    .error loadReposFromGitHub
    .then R.map R.pick ['git_url', 'name']
    .then R.filter ({name}) -> not fs.existsSync "#{__dirname}/../#{name}"
    .then R.map cloneRepo
    .then Promise.all

gulp.task 'default', ['setup']
