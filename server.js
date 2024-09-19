// > node server.js 8888
var port = 8080;
if (process.argv.length > 2) port = parseInt(process.argv[2]);

const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./')); //Tells the app to serve static files from ./

// Listen for control config data
app.post('/config/save', function (req, res) {
  var filename = req.body.filename;
  var dataIn = req.body.data;
  var dataFileIn = {};

  // read in data if it already exists
  if (fs.existsSync(filename)) {
    dataFileIn = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }

  // extend data
  var dataOut = Object.assign({}, dataFileIn, dataIn);

  // write to file
  fs.writeFile(filename, JSON.stringify(dataOut, null, 2), 'utf8', function (err, data) {
    console.log('Wrote data to file');
  });

  // return response
  res.send({
    status: 1,
    message: 'Success',
  });
});

app.listen(port, () => console.log('Listening on port ' + port));
