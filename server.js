// A simple web server
// > npm install connect serve-static
// > node server.js
var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8080, function(){
  console.log('Server running on 8080...');
});
