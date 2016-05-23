// jslint white: true
// jshint esversion: 6
// jshint strict: implied
// jshint node: true
// jshint laxcomma: true

var synaptic = require('synaptic')
  , fs       = require('fs')
  , tools    = require('./common_tools.js')
  , netJson  = require('./net_synaptic.json')
  , assert   = require('assert');

var Neuron = synaptic.Neuron
  , Layer = synaptic.Layer
  , Network = synaptic.Network
  , Trainer = synaptic.Trainer
  , Architect = synaptic.Architect;

var netProperties = tools.netProperties;

var connections   = netJson.connections
  , neurons       = netJson.neurons;

// get network propersties as object 
// {'weight':[connections count], 'activation':[input+hidden+output count], 'bias':[hidden+output count]'
function getNetworkNumbers(netProperties, connections, neurons)
{
    console.log("Props: " + JSON.stringify(netProperties));

    let hiddenStart = netProperties.input
      , hiddenEnd   = hiddenStart + netProperties.hidden
      , outputEnd   = hiddenEnd   + netProperties.output;

    let weight     = []
      , activation = []
      , bias       = [];

    let index = 0;
    for (let c of connections)
    {
        weight[index++] = c.weight;
    }

    let connectionsCount = netProperties.input * netProperties.hidden + netProperties.hidden * netProperties.output;
    assert.equal(index, connectionsCount, "something went wrond with connections count. index:" + index + "; connections:" + connectionsCount);

    index = 0;
    for (let n of neurons)
    {
        let biasIndex = index - hiddenStart;
        activation[index] = n.activation;
        if (biasIndex >= 0)
            bias[biasIndex] = n.bias;

        if (n.activation > 0 || n.bias !== 0)
            console.log(" > idx:" + index + "; n: " + JSON.stringify(n));

        assert(biasIndex >= 0 || n.bias === 0, "it's strange to have a bias for input");
        assert(biasIndex >= 0 || n.activation === 1 || n.activation === 0, "strange activation for input");

        index++;
    }

    let result = {
        'weight': weight,
        'activation': activation,
        'bias': bias,
    };

    console.log("found weights:" + result.weight.length + "; activation:" + result.activation.length + "; bias: " + result.bias.length);

    return result;
}

// Get network properties as Buffer:
//
// +----------------+-------------------------------+
// | size           | data                          |
// +----------------+-------------------------------+
// | 4              | input layer size (i)          |
// +----------------+-------------------------------+
// | 4              | hidden size      (h)          |
// +----------------+-------------------------------+
// | 4              | output size      (o)          |
// +----------------+-------------------------------+
// | 8 * (i*h+h*o)  | weight[] (8-byte doubles)     |
// +----------------+-------------------------------+
// | 1 * i          | activation[] bytes for input  |
// +----------------+-------------------------------+
// | 8 * (h+o)      | activation[] (8-byte doubles) |
// +----------------+-------------------------------+
// | 8 * (h+o)      | bias[] (8-byte doubles)       |
// +----------------+-------------------------------+
function getNetworkBuffer(netProperties, netNumbers)
{
    let neuronsCount     = netProperties.input + netProperties.hidden + netProperties.output;
    let biasCount        = netProperties.hidden + netProperties.output;
    let connectionsCount = netProperties.input * netProperties.hidden + netProperties.hidden * netProperties.output;

    console.log(JSON.stringify(netNumbers.activation));

    assert.equal(netNumbers.weight.length, connectionsCount, 
        "Invalid weight count: " + netNumbers.weight.length + "; expected:" + connectionsCount);
    assert.equal(netNumbers.activation.length, neuronsCount, 
        "Invalid activation count: " + netNumbers.activation.length + "; expected: " + neuronsCount);
    assert.equal(netNumbers.bias.length, biasCount,
        "Invalid bias length");

    let bufferSize = 4 * 3/*(i),(h),(o)*/ 
                   + 8 * connectionsCount                // weight[]
                   + 8 * biasCount + netProperties.input // activation[]
                   + 8 * biasCount;                      // bias[]

    let buffer = new Buffer(bufferSize);

    let offset = buffer.writeInt32LE(netProperties.input,  0);
    offset     = buffer.writeInt32LE(netProperties.hidden, 4);
    offset     = buffer.writeInt32LE(netProperties.output, 8);

    let wOffset = offset;
    for (let w of netNumbers.weight)
        offset = buffer.writeDoubleLE(w, offset);
    assert.equal(offset, wOffset + 8 * connectionsCount, "weight: something went wrong");

    let aOffset = offset;
    let aIndex  = 0;
    for (let a of netNumbers.activation)
    {
        if (aIndex < netProperties.input)
            offset = buffer.writeInt8(a, offset);
        else
            offset = buffer.writeDoubleLE(a, offset);

        ++aIndex;
    }

    assert.equal(offset, aOffset + netProperties.input + 8 * biasCount, "activation: something went wrong");

    let bOffset = offset;
    for (let b of netNumbers.bias)
        offset = buffer.writeDoubleLE(b, offset);

    assert.equal(offset, bOffset + 8 * biasCount, "bias: something went wrong");
    assert.equal(offset, bufferSize);
    return buffer;
}

var numbers = getNetworkNumbers(netProperties, connections, neurons)
  , buffer  = getNetworkBuffer(netProperties, numbers);

fs.writeFileSync('./net_synaptic_minified.bin', buffer);
console.log("Done. props: " + JSON.stringify(netProperties));



