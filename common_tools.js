// jslint white: true
// jshint esversion: 6
// jshint strict: implied
// jshint node: true

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

module.exports.getWordCodes = getWordCodes;
module.exports.minCode      = minCode;
module.exports.maxCode      = maxCode;
module.exports.MAX_LENGTH    = MAX_LENGTH;
