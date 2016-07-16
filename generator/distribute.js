#!/usr/bin/env node

/* 
 * Taken from http://cruft.io/posts/node-command-line-utilities/
 */ 

var program = require('commander');
var request = require('request');
var chalk = require('chalk');
var _ = require('underscore');
var fs = require('fs');
var execFile = require('child_process').execFile;

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

function runDeploy(queue) {
    // This queue processes each repo until completion
    var item = queue.pop();
    if (item) {
        console.log(chalk.cyan.bold("\nRunning deploy for: " + item.REPO_NAME));

        // Need to run this async in order to pipe stdout

        var deploySh = execFile('sh', [ 'deploy.sh' ], {
          //cwd: process.env.PWD + '/' + dirname,
          env:_.extend(process.env, item)
        }, function(error) {
          if (error) {
            console.log(chalk.red(error));
            process.exit(1);
          } else {
            runDeploy(queue);
          }
        })

        deploySh.stdout.pipe(process.stdout);
        deploySh.stderr.pipe(process.stderr);
    } else {
        // End of the queue
        console.log(chalk.yellow('Success!'));
        process.exit(0);
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
    var url = 'https://api.github.com/repos/openactive/dataset-site-generator/forks';

    console.log("Contacting GitHub...");

    request({
        method: 'GET',
        headers: {
            'User-Agent': 'Dataset Site Generator Distribute Script',
            'Authorization': 'token ' + program.token
        },
        url: url
    }, function(error, response, body) {

        console.log("Response received...");

        if (!error && response.statusCode == 200) {
            var body = JSON.parse(body);
            if(program.full) {
                console.log(body);
            } 

            var queue = [];

            for(var i = 0; i < body.length; i++) {
                console.log(chalk.magenta.bold('\nFound: ' + body[i].name ));
                console.log(chalk.grey('Desc: ' + body[i].description ));
                console.log(chalk.grey('Push: ' + body[i].permissions.push ));
                console.log(chalk.grey('Git URL: ' + body[i].git_url ));

                if (body[i].permissions.push) {
                    //Only operatate on repos we have access to
                    console.log(chalk.cyan.bold('\nCreating environment for: ' + body[i].git_url  + '...'));
                    queue.push(createEnv(body[i].name, body[i].git_url, program.token));
                }
            }
            runDeploy(queue);

        } else if (error) {
            console.log(chalk.red('Error: ' + error));
            process.exit(1);
        }
    });
}