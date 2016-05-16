// jslint white: true
// jshint esversion: 6
// jshint strict: implied
// jshint node: true

var synaptic   = require('synaptic'),
    fs         = require('fs'),
    tools      = require('./common_tools.js'),
    trainInput = require('./train-input.json');

var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var neuronsCount = (tools.maxCode - tools.minCode) * tools.MAX_LENGTH;

// net: 'neuronsCount' for each leven including input, 1 neuron output
console.log("Creating network with " + neuronsCount + " neurons per each layer...");
var net = new Architect.Perceptron(neuronsCount, neuronsCount, 1);

console.log("Creating bundle for trining...");
var trainBundle = [];
for (var word in trainInput)
{
    let isCorrect = trainInput[word];
    let charCodes = tools.getWordCodes(word);

    console.log(word + /* "(" + charCodes + */ " - " + isCorrect);

    trainBundle.push({input: charCodes, output: (isCorrect ? [1] : [0])});
}

console.log("Creating trainer...");
var trainer = new Trainer(net);

console.log("Training " + trainBundle.length + " items...");
trainer.train(trainBundle, 
{
    iterations: 20000,
    error: 0.01,
    log: 100,
});

// test network:
console.log("Test results:");

var samples = ["dog", "cat", "bab", "bzb", "bbb", "bac", "bad"]; //, "cat", "bus", "ear", "eat", "eee", "beat", "brain", "bear"];
//var samples = ["tritoxide", "grasswork", "grass", "unflanged", "oryctologic", "lamb's", "lamb", "bonsai's", "bonsai", "pelagia", "belaz", "pelaz", "lampelagia", "racis", "stical", "mand", "critoxide", "cridoxide", "crepoxize", "classwork"];

for(word of samples)
{
    let codes  = tools.getWordCodes(word);
    let output = net.activate(codes);
    console.log(word + /*"(" + codes + ")" + */ " - output: " + JSON.stringify(output));
}

// save net json
var serialized = JSON.stringify(net.toJSON());
fs.writeFileSync("net_synaptic.json", serialized);
