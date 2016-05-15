var result = {};

for (let i=0; i<1000; ++i)
{
    let file = require('./'+i);
    for (prop in file)
    {
        result[prop] = file[prop];
    }
}

console.log(JSON.stringify(result));
