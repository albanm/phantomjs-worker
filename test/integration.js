var fs = require('fs');
var should = require('should');
var request = require('request');
var PDFParser = require('pdf2json');

function documentAPI(options, callback) {
  options.url = 'http://localhost:3121/document';
  options.encoding = null;

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

  it('should get a PDF from a HTML file', function(callback) {
    var options = {
      headers: {
        'Content-Type': 'text/html',
        Accept: 'application/pdf'
      },
      body: fs.readFileSync(__dirname + '/resources/hello_world.html')
    };

    documentAPI(options, function(err, result) {
      should.not.exist(err);

      var pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', function(data) {
        data.data.Pages.should.have.lengthOf(1);
        data.data.Width.should.equal(167.922);
        data.data.Pages[0].Height.should.equal(86.375);
        data.data.Pages[0].Texts[0].R[0].T.should.equal('H');
        callback();
      });

      pdfParser.parseBuffer(result);
    });
  });

  it('should get a PDF from a HTML file with custom resolution', function(callback) {
    var options = {
      headers: {
        'Content-Type': 'text/html',
        Accept: 'application/pdf'
      },
      body: fs.readFileSync(__dirname + '/resources/hello_world.html'),
      qs: {
        width: 1000,
        height: 1000
      }
    };

    documentAPI(options, function(err, result) {
      should.not.exist(err);

      var pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', function(data) {
        data.data.Pages.should.have.lengthOf(1);
        data.data.Width.should.equal(67.719);
        data.data.Pages[0].Height.should.equal(24.625);
        data.data.Pages[0].Texts[0].R[0].T.should.equal('H');
        callback();
      });

      pdfParser.parseBuffer(result);
    });
  });

  it('should get a PDF from a HTML file with lower quality', function(callback) {
    var options = {
      headers: {
        'Content-Type': 'text/html',
        Accept: 'application/pdf'
      },
      body: fs.readFileSync(__dirname + '/resources/hello_world.html'),
      qs: {
        quality: 50
      }
    };

    documentAPI(options, function(err, result) {
      should.not.exist(err);

      // TODO check quality difference. File size is the same with this very basic hello world example.

      var pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', function(data) {
        data.data.Pages.should.have.lengthOf(1);
        data.data.Width.should.equal(167.922);
        data.data.Pages[0].Height.should.equal(86.375);
        data.data.Pages[0].Texts[0].R[0].T.should.equal('H');
        callback();
      });

      pdfParser.parseBuffer(result);
    });
  });
});
