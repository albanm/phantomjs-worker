'use strict';

const phantom = require('phantom');
const mime = require('mime-types');
const fs = require('fs');
const uuid = require('node-uuid');

let phantomBridge;
exports.init = (callback) => {
  // See available options : http://phantomjs.org/api/command-line.html
  phantom.create(['--web-security=no', '--ignore-ssl-errors=yes', '--ssl-protocol=any']).then((pb) => {
    console.info('Phantom bridge Initiated');
    phantomBridge = pb;
    callback();
  });
};

exports.convertDocument = (req, res, next) => {
  convert(req, res).then(function() {}, next);
};

function convert(req, res) {
  const inputType = req.get('content-type');
  const outputType = req.get('accept').split(';')[0];
  const outputExtension = mime.extension(outputType);
  const delay = req.query.delay ? parseInt(req.query.delay) : null;
  const waitForConsole = req.query.waitForConsole;

  const tempPath = '/tmp/' + uuid.v1() + '.' + outputExtension;

  return phantomBridge.createPage().then((page) => {
    console.log('Phantom bridge page created');

    function wait() {
      // TODO another policy that waits for a delay without ajax requests ?

      return new Promise((resolve) => {
        if (delay) {
          setTimeout(resolve, delay);
        } else if (waitForConsole) {
          page.on('onConsoleMessage', (callbackData) => {
            if (callbackData === waitForConsole) resolve();
          });
        } else {
          resolve();
        }
      });
    }

    function render() {

      return wait().then(function() {

        // Default is the resolution of a A4 paper at 300 dpi
        return page.property('viewportSize', {
          width: req.query.width || 2480,
          height: req.query.height || 3508
        }).then(() => {
          if (outputExtension === 'html') {
            console.log('Phantom bridge get rendered content');
            return page.property('content').then((content) => {
              res.send(content);
            });
          } else {
            console.log('Phantom bridge render page to a temp file');
            return page.render(tempPath, {
              format: outputExtension,
              quality: req.query.quality || 100
            }).then(() => {
              console.log('Phantom bridge render finished');
              var readStream = fs.createReadStream(tempPath);
              readStream.pipe(res);

              res.on('finish', () => {
                console.log('Phantom worker delete temp file ' + tempPath);
                fs.unlink(tempPath, (err) => {
                  if (err) console.error('Phantom worker failed to remove temp file', err.stack);
                });
              });
            });
          }
        });
      });
    }

    if (inputType === 'text/uri-list') {
      return page.open(req.body).then((status) => {
        console.log('Phantom bridge url opened, status: ' + status + ', url: ' + req.body);
        if (status === 'fail') throw new Error('phantomjs failed to open url: ' + req.body);
        return render();
      });
    } else {
      return page.property('content', req.body, 'http://www.phantomjs.org/').then(() => {
        console.log('Phantom bridge content added');
        return render();
      });
    }
  });
}
