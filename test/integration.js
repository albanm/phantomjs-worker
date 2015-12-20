var fs = require('fs');
var should = require('should');
var request = require('request');

function documentAPI(inputType, outputType, data, callback) {
  var options = {
    url: 'http://localhost:3131/document',
    headers: {
      'Content-Type': inputType,
      Accept: outputType
    }
  };

  var isBuffer = data instanceof Buffer;
  if (typeof data === 'object' && !isBuffer) data = JSON.stringify(data);

  if (data) {
    options.body = data;
  }

  if (isBuffer || !data) {
    options.encoding = null;
  }

  if (callback) {
    request.post(options, function(err, response) {
      if (err) return callback(err);
      if (response.statusCode !== 200) {
        err = new Error(response.body);
        err.code = response.statusCode;
        return callback(err);
      }

      var result = response.body;
      if (isBuffer) {
        result = result.toString();
      }
      callback(null, result);
    });
  } else {
    return request.post(options);
  }
}

describe('Phantomjs converter worker', function() {

  after(function(cb) {
    setTimeout(cb, 1000);
  });

  it('should get a PDF from a HTML file', function(callback) {
    documentAPI('text/html', 'application/pdf', fs.readFileSync(__dirname + '/resources/hello_world.html'),
      function(err) {
        should.not.exist(err);
        // TODO: a way to check the content
        callback();
      });
  });
});
