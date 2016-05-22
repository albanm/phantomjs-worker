'use strict';

const fs = require('fs');
const should = require('should');
const request = require('request');
const PDFParser = require('pdf2json');
const http = require('http');
const exec = require('child_process').exec;

function documentAPI(options, callback) {
  options.url = 'http://localhost:3121/document';
  options.encoding = null;

  request.post(options, (err, response) => {
    if (err) return callback(err);
    if (response.statusCode !== 200) {
      err = new Error(response.body);
      err.code = response.statusCode;
      return callback(err);
    }

    const result = response.body;
    callback(null, result);
  });
}

describe('Phantomjs converter worker', () => {

  it('should get a PDF from a HTML file', (callback) => {
    const options = {
      headers: {
        'Content-Type': 'text/html',
        Accept: 'application/pdf'
      },
      body: fs.readFileSync(__dirname + '/resources/hello_world.html')
    };

    documentAPI(options, (err, result) => {

      should.not.exist(err);

      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', (data) => {
        data.data.Pages.should.have.lengthOf(1);
        data.data.Width.should.equal(426.25);
        data.data.Pages[0].Height.should.equal(219.25);
        data.data.Pages[0].Texts[0].R[0].T.should.equal('H');
        callback();
      });

      pdfParser.parseBuffer(result);
    });
  });

  it('should get a PDF from a HTML file with custom resolution', (callback) => {
    const options = {
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

    documentAPI(options, (err, result) => {
      should.not.exist(err);

      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', (data) => {
        data.data.Pages.should.have.lengthOf(1);
        data.data.Width.should.equal(171.875);
        data.data.Pages[0].Height.should.equal(62.5);
        data.data.Pages[0].Texts[0].R[0].T.should.equal('H');
        callback();
      });

      pdfParser.parseBuffer(result);
    });
  });

  it('should get a PDF from a HTML file with lower quality', (callback) => {
    const options = {
      headers: {
        'Content-Type': 'text/html',
        Accept: 'application/pdf'
      },
      body: fs.readFileSync(__dirname + '/resources/hello_world.html'),
      qs: {
        quality: 50
      }
    };

    documentAPI(options, (err, result) => {
      should.not.exist(err);

      // TODO check quality difference. File size is the same with this very basic hello world example.

      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataReady', (data) => {
        data.data.Pages.should.have.lengthOf(1);
        data.data.Width.should.equal(426.25);
        data.data.Pages[0].Height.should.equal(219.25);
        data.data.Pages[0].Texts[0].R[0].T.should.equal('H');
        callback();
      });

      pdfParser.parseBuffer(result);
    });
  });

  it('should get a rendered HTML from an online webpage', (callback) => {
    const tempServer = http.createServer((req, res) => {
      res.end(fs.readFileSync(__dirname + '/resources/hello_world.html'));
    });
    tempServer.listen(3122, (err) => {
      should.not.exist(err);

      // get host ip
      exec('ip route | awk \'/docker/ { print $NF }\'', (err, out) => {
        should.not.exist(err);

        const options = {
          headers: {
            'Content-Type': 'text/uri-list',
            Accept: 'text/html'
          },
          body: 'http://' + out.trim() + ':3122'
        };

        documentAPI(options, (err, result) => {
          should.not.exist(err);
          result.toString().should.match(/Hello World/);
          callback();
        });
      });
    });
  });

  it('should get a rendered HTML from an online webpage with delay', (callback) => {
    const tempServer = http.createServer((req, res) => {
      res.end(fs.readFileSync(__dirname + '/resources/hello_world_delay.html'));
    });
    tempServer.listen(3123, (err) => {
      should.not.exist(err);

      // get host ip
      exec('ip route | awk \'/docker/ { print $NF }\'', (err, out) => {
        should.not.exist(err);

        const options = {
          headers: {
            'Content-Type': 'text/uri-list',
            Accept: 'text/html'
          },
          qs: {
            delay: 300
          },
          body: 'http://' + out.trim() + ':3123'
        };

        documentAPI(options, (err, result) => {
          should.not.exist(err);
          result.toString().should.match(/Hello World/);
          callback();
        });
      });
    });
  });

  it('should get a rendered HTML from an online webpage with expected console.log to signify readiness', (callback) => {
    const tempServer = http.createServer((req, res) => {
      res.end(fs.readFileSync(__dirname + '/resources/hello_world_callback.html'));
    });
    tempServer.listen(3124, (err) => {
      should.not.exist(err);

      // get host ip
      exec('ip route | awk \'/docker/ { print $NF }\'', (err, out) => {
        should.not.exist(err);

        const options = {
          headers: {
            'Content-Type': 'text/uri-list',
            Accept: 'text/html'
          },
          qs: {
            waitForConsole: 'loadFinished'
          },
          body: 'http://' + out.trim() + ':3124'
        };

        documentAPI(options, (err, result) => {
          should.not.exist(err);
          result.toString().should.match(/Hello World/);
          callback();
        });
      });
    });
  });
});
