var phantom = require('phantom');
var mime = require('mime-types');
var fs = require('fs');
var uuid = require('node-uuid');

var phantomBridge;
exports.init = function(callback) {
  // See available options : http://phantomjs.org/api/command-line.html
  phantom.create('--web-security=no', '--ignore-ssl-errors=yes', {
    port: 12345
  }, function(pb) {
    console.info('Phantom bridge Initiated');
    phantomBridge = pb;
    callback();
  });
};

exports.convertDocument = function(req, res, next) {
  var outputType = req.get('accept').split(';')[0];
  var outputExtension = mime.extension(outputType);

  var tempPath = '/tmp/' + uuid.v1() + '.' + outputExtension;

  phantomBridge.createPage(function(page) {
    console.log('Phantom bridge page created');

    page.setContent(req.body, 'http://www.phantomjs.org/', function() {
      console.log('Phantom bridge content added');

      // TODO: listen to requests to allow for more complex page creations

      page.render(tempPath, {
        format: outputExtension,
        quality: '100'
      }, function() {
        console.log('Phantom bridge render finished');
        var readStream = fs.createReadStream(tempPath);
        readStream.on('error', next);
        readStream.pipe(res);

        res.on('finish', function() {
          console.log('Phantom worker delete temp file ' + tempPath);
          fs.unlink(tempPath, function(err) {
            if (err) console.error('Phantom worker failed to remove temp file', err.stack);
          });
        });
      });
    });
  });
};
