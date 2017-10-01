#!/usr/bin/env node

/* 
 * Taken from http://cruft.io/posts/node-command-line-utilities/
 */ 

var program = require('commander');
var chalk = require('chalk');
var _ = require('underscore');
var fs = require('fs');
var execFile = require('child_process').execFile;
var github = require('./github.js');

Array.prototype.sortOn = function(key){
    this.sort(function(a, b){
        if(a[key].toLowerCase() < b[key].toLowerCase()){
            return -1;
        }else if(a[key].toLowerCase() > b[key].toLowerCase()){
            return 1;
        }
        return 0;
    });
}

function createEnv(name, url, token) {
    // get the GH_REF of the form "github.com/abc/xyz.git"
    url = url.replace("git://","");

    // Create a directory to checkout
    var dirname =  'out/' + name + '-clone-';
    try {
        fs.mkdirSync('out');
    } catch (err) {

    }
    var dirname = fs.mkdtempSync(dirname);
    
    // Log the directory name
    console.log('Created directory: ' + dirname);

    return { DIR_NAME: dirname, GH_TOKEN: token, REPO_NAME: name, GH_REF: url };
}

function runScript(env, scriptFilename, cb) {
    console.log(chalk.cyan.bold("\nRunning deploy for: " + env.REPO_NAME));

    // Need to run this async in order to pipe stdout

    var deploySh = execFile('sh', [ scriptFilename ], {
      //cwd: process.env.PWD + '/' + dirname,
      env:_.extend(process.env, env)
    }, function(error) {
      if (error) {
        console.log(chalk.red(error));
        process.exit(1);
      } else {
        cb();
      }
    })

    deploySh.stdout.pipe(process.stdout);
    deploySh.stderr.pipe(process.stderr);
}

function runDeploy(queue, cb) {
    // This queue processes each repo until completion
    var env = queue.pop();
    if (env) {
        runScript(env, 'deploy.sh', function success() {
            runDeploy(queue, cb);
        });
    } else {
        // End of the queue
        console.log(chalk.yellow('\nDistribution Success!'));
        cb();
    }
}

function metadataAccumulator(token, queue, metadataItems, metadataEnv) {
  var repoLocalPath = queue.pop();
  if (repoLocalPath) {
    github.gitHubGetRawJsonContentCached(token, repoLocalPath, "metadata.json", function (metadata) {
      //Only continue if load successful, ignore failure
      console.log("Metadata for: " + metadata["dataset-site-url"] + " (Publish: " + metadata["publish"] + ")");
      if (metadata["publish"]) {
        metadataItems.push(metadata);
      }
      metadataAccumulator(token, queue, metadataItems, metadataEnv);
    });
  } else {
    // Sort alphabetically
    metadataItems.sortOn("title");

    // End of the list, write the directory json
    console.log(chalk.magenta.bold('\nDirectory Dataset Count: ' + metadataItems.length ));
    metadataEnv.DIRECTORY_JSON = JSON.stringify(metadataItems, null, ' ');
    runScript(metadataEnv, 'metadata.sh', function success() {
        console.log(chalk.yellow('\nDirectory Update Success!'));
        process.exit(0);
    });
  }
}

program
    .version('1.0.0')
    .usage('[options]')
    .option('-t, --token [github token]', 'Github Token used to Push')
    .option('-f, --full', 'Return full JSON responses to the console')
    .parse(process.argv);

if(!program.token) {
    program.help();
} else {
    console.log(chalk.cyan.bold('\nGetting Dataset Site Generator Forks...'));

    github.gitHubGetForks(program.token, function(body) {

        if(program.full) {
            console.log(body);
        } 

        var envQueue = [];
        var metadataQueue = [];

        for(var i = 0; i < body.length; i++) {
            console.log(chalk.magenta.bold('\nFound: ' + body[i].name ));
            console.log(chalk.grey('Desc: ' + body[i].description ));
            console.log(chalk.grey('Push: ' + body[i].permissions.push ));
            console.log(chalk.grey('Git URL: ' + body[i].git_url ));
            console.log(chalk.grey('Stargazers: ' + body[i].stargazers_count ));

            //Only operatate on repos we have access to
            if (body[i].permissions.push) {
                console.log(chalk.cyan('\nCreating environment for: ' + body[i].git_url  + '...'));
                envQueue.push(createEnv(body[i].name, body[i].git_url, program.token));
            }

            //Add repos to dataset directory if they have stars > 0
            if (body[i].stargazers_count >= 1) {
                console.log(chalk.cyan('\nAdding to dataset directory queue: ' + body[i].full_name  + '...'));
                metadataQueue.push(body[i].full_name);
            } else {
                console.log(chalk.cyan('\nIgnoring for dataset directory queue (no stars): ' + body[i].full_name  + '...'));
            }
        }

        console.log(chalk.magenta.bold('\nDatasets with push permissions: ' + envQueue.length ));
        console.log(chalk.magenta.bold('\nDataset which are starred: ' + metadataQueue.length ));

        //Create env for updating dataset directory
        var metadataEnv = createEnv("datasets", "git://github.com/openactive/datasets.git", program.token);

        runDeploy(envQueue, function success() {
          metadataAccumulator(program.token, metadataQueue, [], metadataEnv);
        });

    });
}