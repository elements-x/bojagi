# bojagi (esbuild + post builds)
bojagi is a a traditional Korean wrapping cloth for books, gifts, etc.  
<img src="https://user-images.githubusercontent.com/1437734/137397396-907b5436-7489-4a6f-8e5a-25b111397258.png" width=200 />

## Features
* start dev server instantly using esbuild
* support single page application 404 fallback page
* reload browser when a file is updated
* customizable post build functions

## Usage as command
```
$ npm i bojagi -D
$ bojagi build
$ bojagi serve
$ bojagi <section> # any section in bojagi.config.js
```

## Usage as node module
TODO...


## bojagi.config.js example
* all esbuild options are allowed, https://esbuild.github.io/api/#build-api.
* postBuilds: an array of function to run after esbuild.build().  
  a post build function takes two parameters internally
    * esbuild option 
    * esbuild result
  ```
  module.exports = {
    build: {
      entryPoints: ['src/main.js'],
      entryNames: '[name]-[hash]',
      outdir: 'dist',
      bundle: true,
      ...
      postBuilds: [ 
        function(options, buildResult) { // run a websocket server
          const wss = new WebSocketServer({ port: 8081});
          wss.on('connection', socket => wsClients.push(socket));
        }
      ]
    }
  }
  ```
A full example can be found here.
https://github.com/elements-x/elements-x/blob/master/bojagi.config.js

## built-in esbuild plugins

### minifyCssPlugin / minifyHtmlPlubin
esbuild plugin that minify css and html
 * Read .css files as a minified text, not as css object.
 * Read .html files as a minified text

src/main.js
```
import html from './test.html';
import css from './test.css';
console.log(html + css);
```

Example
```
const bojagi = require('bojagi');
const { minifyCssPlugin, minifyHtmlPlugin } = bojagi.esbuildPlugins;
const options = {
  entryPoints: ['src/main.js'],
  plugins: [minifyCssPlugin, minifyHtmlPlugin]
};
bojagi.build(options).then(esbuildResult => {
  ...
});
```

## post builds

### copy
copy files to a directory by replacing file contents
#### parameters
* fromsTo: string. Accepts glob patterns. e.g., 'src/**/!(*.js) public/* dist'
* options:
  * replacements: list of replacement objects
    * match: replacement happens when this regular expression match to a file path.
    * find: regular expression to search string in a file.
    * replace: string value to replace the string found.

Example
```
const bojagi = require('bojagi');
const {copy} = bojagi.postBuilds
const options = { 
  entryPoints: ['src/main.js']
  postBuilds: [
    copy('src/**/!(*.js) public/* dist', {
      replacements: [ {match: /index\.html/, find: /FOO/, replace: 'BAR'} ]
    })
  ]
}
bojagi.build(options).then(esbuildResult => {
  ...
})
```

### injectEsbuildResult
Inject esbuild compile output to index.html.
It accepts a websocket port number as a parameter.
When a websocket port is given, it starts a websocket server and listens to websocket 
to reload the page when a file is updated.

e.g. 
```
  <!-- your index.html -->
  <script src="main.js"></script>
  <link rel="stylesheet" href="style.css" />
  <script>setTimeout(_ => { 
    var ws = new WebSocket('ws://localhost:9000');
    ws.onmessage = e => window.location.reload();
  }, 1000)</script>
  </body>
</html>
```

Example
```
const bojagi = require('bojagi');
const {injectEsbuildResult} = bojagi.postBuilds;
const options = { 
  entryPoints: ['src/main.js']
  postBuilds: [
    injectEsbuildResult(9000) // 9000 is a websocket port number
  ]
}
bojagi.build(options).then(esbuildResult => {
  ...
})
```

### runStaticServer
Run a static http server for a given directory. Two parameters accepted
* dir: a directory to run a static http server. required.
* options (optional)
  * fs: file system to run a static server. e.g. `require('memfs')`. Default `require('fs')`. 
  * port: port number for a server. Default 9100
  * notFound: 404 redirection logic.
    e.g. `{match: /.*$/, serve: path.join(dir, 'index.html')}`

Example
```
const bojagi = require('bojagi');
const {runStaticServer} = bojagi.postBuilds;
const options = { 
  entryPoints: ['src/main.js']
  postBuilds: [
    runStaticServer('src', {fs: require('memfs')}) 
  ]
}
bojagi.build(options).then(esbuildResult => {
  ...
})
```

### watchAndReload
Watch updates in a given directory, and rebuild and reload when a change happens
* dir: a directory to watch

Example
```
const bojagi = require('bojagi');
const {watchAndReload} = bojagi.postBuilds;
const options = { 
  entryPoints: ['src/main.js']
  postBuilds: [
    watchAndReload('src') 
  ]
}
bojagi.build(options).then(esbuildResult => {
  ...
})
```
