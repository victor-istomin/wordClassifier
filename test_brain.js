/*jslint white: true */
// jshint esversion: 6
// jshint strict: implied
// jshint node: true

var brain = require('brain');
var trainInput = require('./train-input.json');
var fs = require('fs');

var minCode = "a".charCodeAt(0) - 1;  // a-1 is special non-alpha char like '
var maxCode = "z".charCodeAt(0) + 1;  // z+1 is special space char, used for padding
var MAX_LENGTH  = 15;

function padEnd(str, desiredLength, padChar)
{
    var padAmount = desiredLength - str.length;
    return padAmount > 0 ? str + padChar.repeat(padAmount) : str;
}

function normalizeWord(word)
{
    var specialChar = String.fromCharCode(minCode);
    var spaceChar   = String.fromCharCode(maxCode);

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

// get 'word' vector
// vector if flattened matrix M(i,j) where 'i' is a letter and 'j' is position in word.
// M(i,j) = 1 if letter 'i' is present on position 'j'
function getWordCodes(word)
{
    var charsVariety   = maxCode - minCode;
    var charCodes = [];

    word = normalizeWord(word);
    for(let i = 0; i < word.length; ++i)
        charCodes[i] = word.charCodeAt(i);

    var vector = [];
    for(let i = 0; i < MAX_LENGTH * charsVariety; ++i)
    {
        let thisChar = minCode + (i % charsVariety);
        let wordPos  = Math.floor(i / charsVariety);
        let code     = charCodes[wordPos];

//        console.log("char: " + word[wordPos] + "; code: " + code + "; ch: " + ch);

        vector[i] = (code == thisChar) ? 1 : 0;
    }

    return vector;
}

var options = {};
options.hiddenLayers = 3;

var net         = new brain.NeuralNetwork(options);
var trainBundle = [];

for (var word in trainInput)
{
    let isCorrect = trainInput[word];
    let charCodes = getWordCodes(word);

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

//console.log("Train bundle: " + JSON.stringify(trainBundle));
//console.log("Train result: " + JSON.stringify(res));
//console.log("");

//var samples = ["dog", "cat", "bab", "bzb", "bbb", "bac", "bad"]; //, "cat", "bus", "ear", "eat", "eee", "beat", "brain", "bear"];
var samples = ["tritoxide", "grasswork", "grass", "unflanged", "oryctologic", "lamb's", "lamb", "bonsai's", "bonsai", "pelagia", "belaz", "pelaz", "lampelagia", "racis", "stical", "mand", "critoxide", "cridoxide", "crepoxize", "classwork"];

for(word of samples)
{
    let codes  = getWordCodes(word);
    let output = net.run(codes);
    console.log(word + /*"(" + codes + ")" + */ " - output: " + JSON.stringify(output));
}

//  console.log("Trained: " + JSON.stringify(net.toJSON()));
var serialized = JSON.stringify(net.toJSON());
fs.writeFileSync("net.json", serialized);

