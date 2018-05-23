// > node server.js 8888
var port = 8080;
if (process.argv.length > 2) port = parseInt(process.argv[2]);

const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./')); //Tells the app to serve static files from ./

// Listen for control config data
app.post('/controls/config', function (req, res) {
  var filename = './controls/config.json';
  fs.writeFile(dataFile, req.body.data, 'utf8', function(err, data){
    console.log('Wrote data to file');
  });
  res.send({
    status: 1,
    message: "Success"
  });
});

app.listen(port, () => console.log('Listening on port '+port));
