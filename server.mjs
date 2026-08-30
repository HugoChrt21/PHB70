import { createReadStream, stat } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = 5500;
const ROOT = fileURLToPath(new URL('.', import.meta.url));

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function sendError(response, statusCode, message) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${HOST}`).pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  const filePath = resolve(ROOT, normalize(relativePath));

  if (!filePath.startsWith(ROOT)) {
    sendError(response, 403, 'Forbidden');
    return;
  }

  stat(filePath, (error, file) => {
    if (error || !file.isFile()) {
      sendError(response, 404, 'Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': 'no-cache',
    });
    createReadStream(filePath).pipe(response);
  });
}).listen(PORT, HOST, () => {
  console.log(`PHB70 local server: http://${HOST}:${PORT}/`);
});
