/*jslint white: true */

var brain = require('brain');
var trainInput = require('./train-input.json');
var fs = require('fs');

var minCode = "a".charCodeAt(0) - 1;  // a-1 is special non-alpha char like '
var maxCode = "z".charCodeAt(0) + 1;  // z+1 is special space char, used for padding

function padEnd(str, desiredLength, padChar)
{
    var padAmount = desiredLength - str.length;
    return padAmount > 0 ? str + padChar.repeat(padAmount) : str;
}

function normalizeWord(word)
{
    var specialChar = String.fromCharCode(minCode);
    var spaceChar   = String.fromCharCode(maxCode);
    var MAX_LENGTH  = 30;

    word = padEnd(word.toLowerCase().substr(0, MAX_LENGTH), MAX_LENGTH, spaceChar);

    for (let i = 0; i < word.length; ++i)
    {
        let ch = word[i];
        if (ch > 'z' || ch < 'a')
        {
            word[i] = specialChar;
        }
    }

    return word;
}

function getWordCodes(word)
{
    var divider   = maxCode - minCode;
    var charCodes = [];

    word = normalizeWord(word);
    for(let i = 0; i < word.length; ++i)
        charCodes[i] = (word.charCodeAt(i) - minCode) / divider;

    return charCodes;
}

var options = {}
options.hiddenLayers = 130;

var net         = new brain.NeuralNetwork(options);
var trainBundle = [];

for (var word in trainInput)
{
    let isCorrect = trainInput[word];
    let charCodes = getWordCodes(word);

//    console.log(word + "(" + charCodes + ") - " + isCorrect);

    trainBundle.push({input: charCodes, output: (isCorrect ? {word: 1} : {err: 1})});
}

var res = net.train(trainBundle, {
        errorThresh: 0.01,
        log: true,
        logPeriod: 20,
        iterations: 4000,
//      learningRate: 0.1
    });

//console.log("Train bundle: " + JSON.stringify(trainBundle));
//console.log("Train result: " + JSON.stringify(res));
//console.log("");

//var samples = ["dog", "xxx", "uid", "bab", "zzz", "bag", "cat", "bus", "ear", "eat", "eee", "beat", "brain", "bear"];
var samples = ["stical", "st", "sleases", "isicoza", "ji", "peppiest", "superstocks", "grasswork", "misunderstangingly" ];

for(word of samples)
{
    let codes  = getWordCodes(word);
    let output = net.run(codes);
    console.log(word + "(" + codes + ")" + " - output: " + JSON.stringify(output));
}

//  console.log("Trained: " + JSON.stringify(net.toJSON()));
var serialized = JSON.stringify(net.toJSON());
fs.writeFileSync("net.json", serialized);

