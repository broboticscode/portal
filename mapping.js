const fs = require('fs')
var apikey;

fs.readFile('gmapkey.txt', (err, data) => {
    if (err) throw err;

    console.log(data.toString());
    apikey = data.toString();
})
