var request = require('request');
var chalk = require('chalk');

//Allow this to be required by node
var exports = module.exports = {};


function gitHubRequest(url, token, method, success, expectedSuccessCode, body) {
    expectedSuccessCode = expectedSuccessCode || 200; //Optional, default = 200
    body = body || ""; //Optional, default = ""

    console.log("Contacting GitHub...");
    console.log(method + ": " + url);

    request({
        method: method,
        headers: {
            'User-Agent': 'Dataset Site Generator Distribute Script',
            'Accept': 'application/vnd.github.swamp-thing-preview+json',
            'Authorization': 'token ' + token
        },
        body: body,
        url: url,
        json: true
    }, function(error, response, body) {

        console.log("Response received...");

        if (!error) {
            if (response.statusCode == expectedSuccessCode) {
                //var body = JSON.parse(body); Body is now parsed before being returned (json: true)
                success(body);
            } else {
                //All fetch errors abort the script
                console.log(chalk.red('Status code does not match expected ' + expectedSuccessCode + ': ' + response.statusCode));
                console.log(chalk.red(JSON.stringify(body, null, ' ')));
                process.exit(1);
            }
        } else if (error) {
            //All fetch errors abort the script
            console.log(chalk.red('Error: ' + error));
            process.exit(1);
        }
    });
}
exports.gitHubRequest = gitHubRequest;


function gitHubGetForks(token, success) {
    var url = 'https://api.github.com/repos/openactive/dataset-site-generator/forks';
    gitHubRequest(url, token, 'GET', function (jsonBody) {
        success(jsonBody);
    });
}
exports.gitHubGetForks = gitHubGetForks;

function gitHubGetOrgMemberships(token, success) {
    var url = 'https://api.github.com/user/memberships/orgs';
    gitHubRequest(url, token, 'GET', function (jsonBody) {
        success(jsonBody);
    });
}
exports.gitHubGetOrgMemberships = gitHubGetOrgMemberships;

function gitHubGetRepoInvites(token, success) {
    var url = 'https://api.github.com/user/repository_invitations';
    gitHubRequest(url, token, 'GET', function (jsonBody) {
        success(jsonBody);
    });
}
exports.gitHubGetRepoInvites = gitHubGetRepoInvites;


function gitHubAcceptOrganisationInvite(token, name, success) {
    var url = 'https://api.github.com/user/memberships/orgs/' + name;
    gitHubRequest(url, token, 'PATCH', function (jsonBody) {
        success(jsonBody);
    }, 200, {
      "state": "active"
    });
}
exports.gitHubAcceptOrganisationInvite = gitHubAcceptOrganisationInvite;


function gitHubAcceptRepoInvite(token, id, success) {
    var url = 'https://api.github.com/user/repository_invitations/' + id;
    gitHubRequest(url, token, 'PATCH', function (jsonBody) {
        success(jsonBody);
    }, 204);
}
exports.gitHubAcceptRepoInvite = gitHubAcceptRepoInvite;


