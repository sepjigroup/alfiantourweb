const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

process.env.NODE_ENV = 'production';

// Dynamic port from SmarterASP.NET (%HTTP_PLATFORM_PORT% or PORT)
const rawPort = process.env.PORT || process.env.HTTP_PLATFORM_PORT || 8080;
const isNamedPipe = typeof rawPort === 'string' && rawPort.startsWith('\\\\.\\pipe\\');

console.log(`> Initializing server with target port/pipe: ${rawPort}`);

// Load pre-compiled Next.js configuration from .next/required-server-files.json
// This completely bypasses next.config.mjs and avoids triggering Turbopack / @parcel/watcher issues on Windows Server
let nextConf = undefined;
const reqFilesPath = path.join(__dirname, '.next', 'required-server-files.json');
if (fs.existsSync(reqFilesPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(reqFilesPath, 'utf8'));
    nextConf = data.config;
    console.log('> Loaded pre-compiled config from required-server-files.json');
  } catch (err) {
    console.warn('> Could not load required-server-files.json, falling back to default:', err.message);
  }
}

const app = next({
  dev: false,
  dir: __dirname,
  conf: nextConf
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const onListen = (err) => {
    if (err) throw err;
    console.log(`> Ready and listening on ${rawPort} (mode: production)`);
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
