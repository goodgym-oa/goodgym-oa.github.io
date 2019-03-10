#!/usr/bin/env node

/* 
 * Taken from http://cruft.io/posts/node-command-line-utilities/
 */ 

var program = require('commander');
var chalk = require('chalk');
var fs = require('fs');
var generate = require('./generator.js').generate;

function standalone(templateFile, redirectTemplateFile, stateFile, outputFile) {
    var fs = require('fs');

    var stateSerialised = fs.readFileSync(stateFile, "utf8");
    var state = JSON.parse(stateSerialised);

    var template = fs.readFileSync(state.redirect ? redirectTemplateFile : templateFile, "utf8");
    
    var output = generate(template, state);

    fs.writeFileSync(outputFile, output);
}

program
    .version('1.0.0')
    .usage('')
    .option('-t, --template [template.html file]', 'Template file containing placeholders')
    .option('-r, --redirect [redirect_template.html file]', 'Redirect template file containing placeholders')
    .option('-m, --metadata [metadata.json file]', 'metadata.json file containing state')
    .option('-o, --output [index.html file]', 'File to write generated output')
    .parse(process.argv);

if(!program.template || !program.metadata || !program.output ) {
    program.help();
} else {
    console.log("Generate params: ")
    console.log(" - template: " + program.template)
    console.log(" - redirect: " + program.redirect)
    console.log(" - metadata: " + program.metadata)
    console.log(" - output: " + program.output)

    try {
        standalone(program.template, program.redirect, program.metadata, program.output);
        console.log(program.output + " updated successfully");
        process.exit(0);
    } catch (err) {
        console.log("Generation error: " + err);
        process.exit(1);
    }
}
