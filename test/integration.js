var fs = require('fs');
var should = require('should');
var request = require('request');
var pdfText = require('pdf-text');

function documentAPI(inputType, outputType, data, callback) {
  var options = {
    url: 'http://localhost:3121/document',
    headers: {
      'Content-Type': inputType,
      Accept: outputType
    },
    body: data,
    encoding: null
  };

  request.post(options, function(err, response) {
    if (err) return callback(err);
    if (response.statusCode !== 200) {
      err = new Error(response.body);
      err.code = response.statusCode;
      return callback(err);
    }

    var result = response.body;
    callback(null, result);
  });
}

describe('Phantomjs converter worker', function() {

  after(function(cb) {
    setTimeout(cb, 1000);
  });

  it('should get a PDF from a HTML file', function(callback) {
    documentAPI('text/html', 'application/pdf', fs.readFileSync(__dirname + '/resources/hello_world.html'),
      function(err, result) {
        should.not.exist(err);
        pdfText(result, function(err, textChunks) {
          should.not.exist(err);
          textChunks[0].should.equal('H');
          callback();
        });
      });
  });
});
