import {createCipheriv, randomBytes, randomUUID} from 'node:crypto';
import {link, mkdir, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';

// The key is private, never served by a route, and must be backed up with the records.
export async function identityKey(directory: string) {
  await mkdir(directory, {recursive: true, mode: 0o700});
  const keyPath = path.join(directory, '.campus-identity-key');
  try { return await checkedKey(keyPath); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const temp = path.join(directory, `.${randomUUID()}.key.tmp`);
  try {
    await writeFile(temp, randomBytes(32), {flag: 'wx', mode: 0o600});
    try { await link(temp, keyPath); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  } finally { await unlink(temp).catch(() => {}); }
  return checkedKey(keyPath);
}

async function checkedKey(keyPath: string) {
  const key = await readFile(keyPath);
  if (key.length !== 32) throw new Error('Invalid campus identity encryption key');
  return key;
}

export function encryptIdentity(value: string | Uint8Array, registrationId: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(registrationId));
  const plaintext = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {algorithm: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64')};
}
