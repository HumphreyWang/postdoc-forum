import {createHash, createHmac} from 'node:crypto';
import {File} from 'node:buffer';
import sharp from 'sharp';
import {mkdir, readFile, writeFile, link, unlink} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {deadlinePassed, discussionTopics, documentTypes, formats, forum, requiresAbstract, roles, topics} from './forum';
import {encryptIdentity, identityKey} from './campus-identity';

export class SubmissionError extends Error {
  constructor(public code: string, public status = 400, public fields: Record<string, string> = {}) { super(code); }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dataRoot = () => path.resolve(process.env.FORUM_DATA_DIR || path.join(process.cwd(), 'data'));
type RecordData = Record<string, unknown>;

async function readRecord(kind: string, id: string): Promise<RecordData | null> {
  try { return JSON.parse(await readFile(path.join(dataRoot(), kind, `${id}.json`), 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}

// Publish only a fully written file. The exclusive hard link also prevents concurrent overwrites.
async function saveRecord(kind: string, id: string, record: RecordData) {
  const directory = path.join(dataRoot(), kind);
  await mkdir(directory, {recursive: true, mode: 0o700});
  const temp = path.join(directory, `.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(record, null, 2), {flag: 'wx', mode: 0o600});
    await link(temp, path.join(directory, `${id}.json`));
    return record;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existing = await readRecord(kind, id);
    if (!existing || existing.fingerprint !== record.fingerprint) throw new SubmissionError('conflict', 409);
    return existing;
  } finally { await unlink(temp).catch(() => {}); }
}

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  const multipart = contentType.startsWith('multipart/form-data');
  if (!multipart && !contentType.startsWith('application/json')) throw new SubmissionError('invalid_request', 415);
  const maxBytes = multipart ? forum.passportPhotoMaxBytes + 65536 : 32768;
  const origin = request.headers.get('origin');
  // Next.js may use localhost internally even when the browser addresses 127.0.0.1
  // or a reverse proxy. Host is the browser-facing authority; the proxy must retain it.
  let trustedOrigin = !origin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = request.headers.get('host') || new URL(request.url).host;
      trustedOrigin = ['http:', 'https:'].includes(parsed.protocol) && parsed.host === host;
      if (process.env.FORUM_PUBLIC_ORIGIN) trustedOrigin = parsed.origin === process.env.FORUM_PUBLIC_ORIGIN;
    } catch { trustedOrigin = false; }
  }
  if (!trustedOrigin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new SubmissionError('invalid_request', 403);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new SubmissionError('invalid_request');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new SubmissionError('too_large', 413); }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  try {
    let json: string;
    let passportPhoto: File | null = null;
    if (multipart) {
      const form = await new Request(request.url, {method: 'POST', headers: {'Content-Type': contentType}, body: bytes}).formData();
      let unexpected = false;
      form.forEach((_value, name) => {if (name !== 'payload' && name !== 'passportPhoto') unexpected = true;});
      if (unexpected || form.getAll('payload').length !== 1 || form.getAll('passportPhoto').length > 1) throw new Error();
      const payload = form.get('payload');
      const photo = form.get('passportPhoto');
      if (typeof payload !== 'string' || Buffer.byteLength(payload) > 32768) throw new Error();
      if (photo !== null && !(photo instanceof File)) throw new Error();
      json = payload;
      passportPhoto = photo as File | null;
    } else { json = bytes.toString('utf8'); }
    const body = JSON.parse(json);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return {body: body as RecordData, passportPhoto};
  } catch { throw new SubmissionError('invalid_request'); }
}

async function preparePassportPhoto(file: File) {
  if (file.size > forum.passportPhotoMaxBytes) throw new SubmissionError('validation', 422, {passportPhoto: 'file_size'});
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new SubmissionError('validation', 422, {passportPhoto: 'file_type'});
  const bytes = Buffer.from(await file.arrayBuffer());
  const jpeg = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if ((!jpeg && !png) || (jpeg && file.type !== 'image/jpeg') || (png && file.type !== 'image/png')) {
    throw new SubmissionError('validation', 422, {passportPhoto: 'file_type'});
  }
  try {
    // Decode and re-encode rather than retain uploaded metadata or untrusted file names.
    const image = await sharp(bytes, {limitInputPixels: 40000000, failOn: 'error'})
      .rotate().resize({width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true})
      .flatten({background: '#ffffff'}).jpeg({quality: 90}).toBuffer();
    if (image.length > forum.passportPhotoMaxBytes) throw new Error();
    return {image, hash: createHash('sha256').update(bytes).digest('hex')};
  } catch { throw new SubmissionError('validation', 422, {passportPhoto: 'invalid_image'}); }
}

export async function submit(request: Request, now = Date.now()) {
  if (process.env.FORUM_FORMS_ENABLED === 'false' || deadlinePassed('registration', now)) throw new SubmissionError('closed', 403);
  const {body, passportPhoto} = await readBody(request);
  const fields: Record<string, string> = {};
  const string = (key: string, min: number, max: number) => {
    const value = typeof body[key] === 'string' ? (body[key] as string).trim() : '';
    if (value.length < min || value.length > max) fields[key] = 'invalid';
    return value;
  };
  const choice = (key: string, choices: readonly string[]) => {
    const value = string(key, 1, 40);
    if (!choices.includes(value)) fields[key] = 'invalid';
    return value;
  };
  const id = string('requestId', 36, 36);
  if (!uuid.test(id)) fields.requestId = 'invalid';
  if (body.consent !== true) fields.consent = 'invalid';
  if (body.campusConsent !== true) fields.campusConsent = 'invalid';
  const locale = choice('locale', ['en']);
  const email = string('email', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'invalid';
  const preference = choice('preference', formats);
  const documentType = choice('documentType', documentTypes);
  const documentNumber = string('documentNumber', 5, 40).replace(/\s+/g, '').toUpperCase();
  // Check formatting only: this does not establish whether a document is genuine.
  if (documentType === 'id_card' && !/^\d{17}[\dX]$/.test(documentNumber)) fields.documentNumber = 'invalid';
  if (documentType === 'passport' && !/^[A-Z0-9-]{5,20}$/.test(documentNumber)) fields.documentNumber = 'invalid';
  const passport = documentType === 'passport';
  const nationality = passport ? string('nationality', 2, 100) : null;
  if (passport && (!passportPhoto || passportPhoto.size === 0)) fields.passportPhoto = 'required';
  const posterFallback = preference === 'oral' ? choice('posterFallback', ['yes', 'no']) === 'yes' : null;
  const personal = {
    name: string('name', 1, 100), email, affiliation: string('affiliation', 2, 200),
    role: choice('role', roles), preference
  };
  const presentation = requiresAbstract(preference) ? {
    title: string('title', 5, 250), authors: string('authors', 2, 1000),
    affiliations: string('affiliations', 2, 1000), topic: choice('topic', topics),
    abstract: string('abstract', 1, 32768), keywords: string('keywords', 0, 200), posterFallback
  } : null;
  // Enforce the word limit on submission, without a live word-count display.
  if (presentation && presentation.abstract.split(/\s+/u).filter(Boolean).length > forum.abstractMaxWords) {
    fields.abstract = 'word_limit';
  }
  const selectedTopics = body.discussionTopics ?? [];
  if (!Array.isArray(selectedTopics) || selectedTopics.length > discussionTopics.length ||
      selectedTopics.some(value => typeof value !== 'string' || !discussionTopics.includes(value as typeof discussionTopics[number]))) {
    fields.discussionTopics = 'invalid';
  }
  if (body.discussionInterest !== undefined && typeof body.discussionInterest !== 'string') fields.discussionInterest = 'invalid';
  const discussion = {
    // Canonical order makes checkbox selection order irrelevant to retry matching.
    topics: discussionTopics.filter(topic => Array.isArray(selectedTopics) && selectedTopics.includes(topic)),
    interest: string('discussionInterest', 0, 1000)
  };
  if (Object.keys(fields).length) throw new SubmissionError('validation', 422, fields);
  if (presentation && deadlinePassed('abstract', now)) throw new SubmissionError('abstract_closed', 403);
  const photo = passport ? await preparePassportPhoto(passportPhoto!) : null;
  const key = await identityKey(dataRoot());
  const fingerprint = createHmac('sha256', key).update(JSON.stringify({
    ...personal, presentation, discussion, documentType, documentNumber, nationality, photoHash: photo?.hash || null, locale
  })).digest('hex');
  const record = {
    schemaVersion: 3, id, kind: 'registration', ...personal, presentation, discussion,
    campusAccess: {
      documentType, purpose: 'campus-entry-application', number: encryptIdentity(documentNumber, id, key),
      ...(photo ? {
        nationality: encryptIdentity(nationality!, `${id}:nationality`, key),
        passportPhoto: {mimeType: 'image/jpeg', size: photo.image.length, content: encryptIdentity(photo.image, `${id}:passport-photo`, key)}
      } : {})
    },
    campusConsent: true, consent: true, locale, status: 'received', createdAt: new Date(now).toISOString(), fingerprint
  };
  // Registration and any abstract are published together in one atomic file operation.
  const saved = await saveRecord('registrations', id, record);
  return {id: saved.id, kind: saved.kind, createdAt: saved.createdAt, status: saved.status, includesAbstract: Boolean(saved.presentation)};
}

export async function handleSubmission(request: Request) {
  const headers = {'Cache-Control': 'no-store'};
  try { return Response.json(await submit(request), {status: 201, headers}); }
  catch (error) {
    if (error instanceof SubmissionError) return Response.json({error: error.code, fields: error.fields}, {status: error.status, headers: {...headers, ...(error.status === 413 ? {'Connection': 'close'} : {})}});
    // Do not log personal data or access codes.
    console.error('Submission storage unavailable', (error as NodeJS.ErrnoException).code || 'unknown');
    return Response.json({error: 'server_error'}, {status: 500, headers});
  }
}
