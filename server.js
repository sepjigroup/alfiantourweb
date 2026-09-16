const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Di IISNode (SmarterASP.NET), process.env.PORT berupa Named Pipe (contoh: \\.\pipe\...)
// Jika di lokal/VPS, berupa angka port (contoh: 3000)
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Server ready on ${port} (mode: ${dev ? 'dev' : 'production'})`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
