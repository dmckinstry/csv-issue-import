/*jslint es6:true*/
"use strict";

const fs = require('fs');
const axios=require('axios');
const { strict } = require('assert');

// UPDATE THESE (and set your GITHUB_TOKEN in the environment)
const owner = 'dmckinstry';
const repo = 'csv-issue-import';
const token = process.env.GITHUB_TOKEN;

// Configure HTTP client
const url = `https://api.github.com/repos/${owner}/${repo}/issues`;
axios.defaults.headers.post.Accept = "application/vnd.github.v3+json";
axios.defaults.headers.post.Authorization = `token ${token}`;

//-----------------------------------------------------------------
// getGitHubUser function - maps TFS users to GitHub users
const userMap = [
    [ "Sample User1",   "dmckinstry"],
    [ "Sample User2",   ""],              // Not mapped in the GitHub side
    [ "No Suchuser",    "dmckinstry"]
];

function getGitHubUser( user ) {
    var foundUser = userMap.find( function( value, index, results) {
        return (user === value[0]);
    });
    if (foundUser === undefined) {
        return "";
    } else {
        return foundUser[1];
    }
}

//-----------------------------------------------------------------
// createIssue function
// Work Item Type and state are stored as a labels
function createIssue( title, workitem_type, state, description, assignee ) {
    var body = {
        title: title,
        body: description,
        assignees: [ getGitHubUser(assignee) ],
        labels: [ workitem_type, state ]
    };

    var response = axios.post(url, body)
    .then((res) => {
        var issueNumber = res.data.number;
        console.log(`Created issue #${issueNumber}`);
    })
    .catch((error) => {
        console.error(error);
    });
}

//-----------------------------------------------------------------
fs.readFile('wit.csv', function(err, charBuffer) {
    var fileContents = charBuffer.toString();
    var lines = fileContents.split('\n');
    // The first line is the server name, so skip it
    // The second line is column headers (skipped)
    var headers = lines[1].split(',');

    // We are capturing all of it as historical in the description
    for( var i=2; i< lines.length; i++ ) {
        var id, workitem_type, title, user, state;
        var description = "*MIGRATED FROM WORK ITEM:*\n\n";
        var columns = lines[i].split(',');

        for( var j=0; j<columns.length; j++) {
            switch (headers[j]) {
                case 'ID':
                    id = columns[j];
                break;
                case 'Work Item Type':
                    workitem_type = columns[j];
                break;
                case 'Title':
                    title = columns[j];
                break;
                case 'Assigned To':
                    user = columns[j];
                break;
                case 'State':
                    state = columns[j];
                break;
            }
            description += `- *${headers[j]}:* ${columns[j]}\n`
        }

        if (id > 0 ) {
            createIssue( title, workitem_type, state, description, user );
        }
    }
});