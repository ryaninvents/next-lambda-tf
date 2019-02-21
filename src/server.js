const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });

let memoizedServer;

function createServer () {
  if (memoizedServer) return memoizedServer;
  const server = memoizedServer = express();

  server.get('/debug/*', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(`<html>
  <body>
    <h1>Hello Lambda!</h1>
    <pre>${JSON.stringify({
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    hostname: req.hostname,
    params: req.params,
    query: req.query,
    baseUrl: req.baseUrl,
    headers: req.headers,
    rawHeaders: req.rawHeaders,
    url: req.url
  }, null, 2)}</pre>
  </body>
</html>`);
  });

  if (!dev) {
    // Quirk of Lambda: Since `app.getRequestHandler()` does not seem to
    // work, if we're in production then we need to manually serve the
    // generated JS from the `.next` directory.
    //
    // If you'd like to speed things up a bit, and perhaps lower costs,
    // you might consider copying the static assets to an S3 bucket and
    // serve them using CloudFront.
    server.use('/_next', express.static(`${__dirname}/.next`));
  }

  server.use((req, res) => {
    // For some reason, `app.getRequestHandler()` does not play nicely with
    // AWS Lambda, so we need to use `render` and explicitly pass the path
    // instead. This is a benefit, though, since it's easier to override
    // file-system routing for better SEO.
    app.render(req, res, req.path, req.query);
  });

  return server;
}

if (dev) {
  app.prepare().then(() => {
    const server = createServer();
    server.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  });
}

export default createServer();
