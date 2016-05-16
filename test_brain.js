/*jslint white: true */
// jshint esversion: 6
// jshint strict: implied
// jshint node: true

var brain      = require('brain');
var trainInput = require('./train-input.json');
var fs         = require('fs');
var tools      = require('./common_tools.js');

var options = {};
options.hiddenLayers = 3;

var net         = new brain.NeuralNetwork(options);
var trainBundle = [];

for (var word in trainInput)
{
    let isCorrect = trainInput[word];
    let charCodes = tools.getWordCodes(word);

    console.log(word + /* "(" + charCodes + */ " - " + isCorrect);

    trainBundle.push({input: charCodes, output: (isCorrect ? {word: 1, err: 0} : {err: 1, word: 0})});
}

console.log("Training " + trainBundle.length + " items...");

var res = net.train(trainBundle, {
        errorThresh: 0.01,
        log: true,
        logPeriod: 500,
        iterations: 10000,
//      learningRate: 0.1
    });

console.log("Ok");

//var samples = ["dog", "cat", "bab", "bzb", "bbb", "bac", "bad"]; //, "cat", "bus", "ear", "eat", "eee", "beat", "brain", "bear"];
var samples = ["tritoxide", "grasswork", "grass", "unflanged", "oryctologic", "lamb's", "lamb", "bonsai's", "bonsai", "pelagia", "belaz", "pelaz", "lampelagia", "racis", "stical", "mand", "critoxide", "cridoxide", "crepoxize", "classwork"];

for(word of samples)
{
    let codes  = tools.getWordCodes(word);
    let output = net.run(codes);
    console.log(word + /*"(" + codes + ")" + */ " - output: " + JSON.stringify(output));
}

//  console.log("Trained: " + JSON.stringify(net.toJSON()));
var serialized = JSON.stringify(net.toJSON());
fs.writeFileSync("net.json", serialized);

