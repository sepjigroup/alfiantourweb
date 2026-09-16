const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Ambil dynamic port dari SmarterASP.NET (%HTTP_PLATFORM_PORT% atau PORT).
// Tidak menggunakan port 3000.
const rawPort = process.env.PORT || process.env.HTTP_PLATFORM_PORT || 8080;
const isNamedPipe = typeof rawPort === 'string' && rawPort.startsWith('\\\\.\\pipe\\');

console.log(`> Initializing server with target port/pipe: ${rawPort}`);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const onListen = (err) => {
    if (err) throw err;
    console.log(`> Ready and listening on ${rawPort} (mode: ${dev ? 'dev' : 'production'})`);
  };

  if (isNamedPipe) {
    server.listen(rawPort, onListen);
  } else {
    server.listen(Number(rawPort), '0.0.0.0', onListen);
  }
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
