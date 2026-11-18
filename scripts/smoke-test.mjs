import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://localhost:3026';
for (const path of ['','/program','/registration','/venue','/contact','/credits']) {
  const response = await fetch(base + '/en' + path);
  assert.equal(response.status, 200, path);
  const old = await fetch(base + '/zh' + path, {redirect: 'manual'});
  assert.equal(old.status, 308);
  assert.equal(new URL(old.headers.get('location'), base).pathname, '/en' + path);
}
const qr = await fetch(base + '/images/tencent-registration.png');
assert.equal(qr.status, 200);
assert.deepEqual(Buffer.from(await qr.arrayBuffer()), await readFile(new URL('../public/images/tencent-registration.png', import.meta.url)));
for (const path of ['/api/registrations','/api/abstracts']) {
  const response = await fetch(base + path, {method: 'POST'});
  assert.equal(response.status, 410);
}
console.log('Verified public routes, language redirects, supplied QR image and retired collection endpoints.');
