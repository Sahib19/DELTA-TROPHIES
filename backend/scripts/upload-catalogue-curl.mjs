import 'dotenv/config';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;
if (!cloud || !key || !secret) throw new Error('Cloudinary credentials are missing');

const publicId = 'deltatrophies/catalog/catalogue.json';
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = createHash('sha1')
  .update(`invalidate=true&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${secret}`)
  .digest('hex');
const file = path.resolve('../frontend/public/catalogue.json');
const response = spawnSync(
  'curl.exe',
  [
    '--fail-with-body',
    '--silent',
    '--show-error',
    '--max-time',
    '120',
    '-X',
    'POST',
    `https://api.cloudinary.com/v1_1/${cloud}/raw/upload`,
    '-F',
    `file=@${file};type=application/json`,
    '-F',
    `api_key=${key}`,
    '-F',
    `timestamp=${timestamp}`,
    '-F',
    `public_id=${publicId}`,
    '-F',
    'overwrite=true',
    '-F',
    'invalidate=true',
    '-F',
    `signature=${signature}`,
  ],
  { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
);
if (response.status !== 0) {
  throw new Error(`Catalogue upload failed: ${response.stderr || response.stdout}`);
}
const result = JSON.parse(response.stdout);
process.stdout.write(
  `${JSON.stringify({ public_id: result.public_id, version: result.version, bytes: result.bytes, secure_url: result.secure_url })}\n`,
);
