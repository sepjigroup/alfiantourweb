const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Dynamic port handling for SmarterASP.NET, Railpack, Docker, or Local
const rawPort = process.env.PORT || 3000;
const isNamedPipe = typeof rawPort === 'string' && rawPort.startsWith('\\\\.\\pipe\\');

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const onListen = (err) => {
    if (err) throw err;
    console.log(`> Ready on ${rawPort} (mode: ${dev ? 'dev' : 'production'})`);
  };

  if (isNamedPipe) {
    // Windows IISNode named pipe
    server.listen(rawPort, onListen);
  } else {
    // Dynamic TCP port (Docker / Railpack / Cloud hosting) on 0.0.0.0
    server.listen(Number(rawPort), '0.0.0.0', onListen);
  }
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
