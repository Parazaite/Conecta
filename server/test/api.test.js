import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('health endpoint reports the API is responding', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('private profile endpoint rejects requests without a token', async () => {
  const response = await fetch(`${baseUrl}/api/profiles/me`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Entre na sua conta para continuar.' });
});

test('unknown routes return a clear not-found response', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Rota não encontrada.' });
});
