#!/usr/bin/env node

/* 
 * Taken from http://cruft.io/posts/node-command-line-utilities/
 */ 

var program = require('commander');
var chalk = require('chalk');
var github = require('./github.js');

function acceptInvite(token, queue) {
    // This queue processes each repo until completion
    var item = queue.pop();
    if (item) {
        if (item.inviteType == "Organization") {
            console.log(chalk.cyan.bold("\nAccepting organisation invite for: " + item.name));

            github.gitHubAcceptOrganisationInvite(token, item.name, function(body) {
                console.log(chalk.grey('Invite accepted'));
                acceptInvite(token, queue);
            });
        } else if (item.inviteType == "Repository") {
            console.log(chalk.cyan.bold("\nAccepting repository invite for: " + item.name));

            github.gitHubAcceptRepoInvite(token, item.id, function(body) {
                console.log(chalk.grey('Invite accepted'));
                acceptInvite(token, queue);
            });
        } else {
            // Logic error in script
            console.log(chalk.red('Error: Unexpected inviteType "' + item.inviteType + '"'));
            process.exit(1);
        }
    } else {
        // End of the queue
        console.log(chalk.yellow('\nInvite Processing Success!'));
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
    console.log(chalk.cyan.bold('\nGetting Organization Memberships...'));

    github.gitHubGetOrgMemberships(program.token, function(body) {

        if(program.full) {
            console.log(body);
        } 

        var queue = [];

        for(var i = 0; i < body.length; i++) {
            console.log(chalk.magenta.bold('\nFound: ' + body[i].organization.login ));
            console.log(chalk.grey('State: ' + body[i].state ));

            if (body[i].state == "pending") {
                //Only operatate on repos we do not have access to
                console.log(chalk.cyan.bold('\nAdding to organisation invite queue: ' + body[i].organization.login  + '...'));
                queue.push({
                    inviteType: "Organization",
                    name: body[i].organization.login
                });
            }
        }

        console.log(chalk.cyan.bold('\nGetting Repository Invitations...'));

        github.gitHubGetRepoInvites(program.token, function(body) {

            if(program.full) {
                console.log(body);
            } 

            for(var i = 0; i < body.length; i++) {
                console.log(chalk.magenta.bold('\nFound: ' + body[i].repository.full_name));

                //Only operatate on repos we do not have access to
                console.log(chalk.cyan.bold('\nAdding to repository invite queue: ' + body[i].repository.full_name  + '...'));
                
                queue.push({
                    inviteType: "Repository",
                    name: body[i].repository.full_name,
                    id: body[i].id
                });
            }

            acceptInvite(program.token, queue);

        });

    });
}