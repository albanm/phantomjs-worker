var http = require('http');
var fs = require('fs');
var ip = require('ip');

var tempServer = http.createServer(function(req, res) {
  console.log('SERVE HTLLO');
  res.end(fs.readFileSync(__dirname + '/resources/hello_world.html'));
});
tempServer.listen(3122, function(err) {
  console.log('listengin', ip.address());
});
