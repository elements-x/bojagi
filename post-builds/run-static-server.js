const path = require('path');
const http = require('http');
const { konsole } = require('../lib/util.js');

// dir
// options
// - port
// - notFound: {match: /^\/(component|tool|css)/, serve: 'dist/index.html'}
module.exports = function runStaticServer(dir, {fs, port, notFound}={}) {
  // fs = fs || require('fs');
  port = port || 9100;
  notFound = notFound || {match: /\/[^\.]+$/, serve: 'index.html'};

  return function(options, esbuildResult) {
    fs = fs || (options.write ? require('fs') : require('memfs'));
    /**
     * run the static server
     */
    const server = http.createServer(function (req, res) {
      let filePath = new URL(`file://${req.url}`).pathname;
      filePath = path.join(dir, filePath);
      fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory() &&
        (filePath = path.join(filePath, 'index.html'));

      if (fs.existsSync(filePath)) {
        const contents = fs.readFileSync(filePath);
        res.end(contents);
      } else if (req.url.match(notFound.match)) {
        konsole.info('\n[esbuild-x serve]', 404, req.url, '->', notFound.serve );
        const notFoundServeFilePath = path.join(dir, notFound.serve);
        const contents = fs.readFileSync(notFoundServeFilePath, {encoding: 'utf8'});
        res.end(contents);
      }
    });
    server.listen(port);
    konsole.info(`[esbuild-x post-builds] http static server running, http://localhost:${port}`);
    return server;
  };
}