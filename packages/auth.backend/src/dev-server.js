import server from './server';

import db from './models/dev/db';

const port = parseInt(process.env.PORT, 10) || 3000;

server.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200);
  res.send(`
<ul>
  <li>
    <a href="/auth/google">/auth/google</a>
  </li>
  <li>
    <a href="/auth/whoami">/auth/whoami</a>
  </li>
</ul>
  `);
});

server.get('/dev/db/all', async (req, res) => {
  const result = await db.pouch.allDocs({
    include_docs: true,
    ...req.query
  });
  res.json(result);
});

server.get('/dev/db/query', async (req, res) => {
  const { table, index, ...opts } = req.query;
  if (opts.key && opts.key.includes(',')) {
    opts.key = opts.key.split(',');
  }
  try {
    res.json(await db.query(table, index, opts));
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

server.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
