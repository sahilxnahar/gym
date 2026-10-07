import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const demosDir = path.join(publicDir, 'demos');
const expectedDemos = ['squat', 'pushup', 'row', 'hinge', 'bridge', 'deadbug'];
const expectedPreviews = ['squat', 'pushup', 'row', 'hinge', 'bridge', 'deadbug'];
const manifestPath = path.join(publicDir, 'media-manifest.json');
const updateManifest = process.argv.includes('--write-manifest');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function inspectGif(buffer, file) {
  const signature = buffer.subarray(0, 6).toString('ascii');
  assert(signature === 'GIF87a' || signature === 'GIF89a', `${file} is not a valid GIF header`);
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  const logicalScreenPacked = buffer[10];
  let offset = 13;
  if (logicalScreenPacked & 0x80) offset += 3 * (2 ** ((logicalScreenPacked & 0x07) + 1));
  let frames = 0;
  let ended = false;

  while (offset < buffer.length) {
    const block = buffer[offset++];
    if (block === 0x3b) {
      ended = true;
      break;
    }
    if (block === 0x21) {
      assert(offset < buffer.length, `${file} has a truncated extension`);
      offset += 1; // extension label
      while (offset < buffer.length) {
        const size = buffer[offset++];
        if (size === 0) break;
        offset += size;
      }
      continue;
    }
    if (block !== 0x2c) throw new Error(`${file} contains an invalid image block at byte ${offset - 1}`);
    assert(offset + 9 <= buffer.length, `${file} has a truncated image descriptor`);
    const localPacked = buffer[offset + 8];
    offset += 9;
    if (localPacked & 0x80) offset += 3 * (2 ** ((localPacked & 0x07) + 1));
    assert(offset < buffer.length, `${file} is missing its LZW code size`);
    offset += 1; // LZW minimum code size
    while (offset < buffer.length) {
      const size = buffer[offset++];
      if (size === 0) break;
      offset += size;
    }
    frames += 1;
  }

  assert(ended && offset <= buffer.length, `${file} is truncated or has no GIF trailer`);
  assert(width > 0 && height > 0 && frames > 0, `${file} has invalid dimensions or no frames`);
  return { width, height, frames };
}

async function inspectPng(buffer, file) {
  const signature = '89504e470d0a1a0a';
  assert(buffer.subarray(0, 8).toString('hex') === signature, `${file} is not a valid PNG`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assert(width > 0 && height > 0, `${file} has invalid dimensions`);
  return { width, height };
}

async function inspectFiles() {
  const gifFiles = [];
  const stillFiles = [];
  const previewGifFiles = [];
  for (const name of expectedDemos) {
    const gifName = `${name}.gif`;
    const stillName = `${name}.png`;
    for (const [filename, collection, inspector] of [
      [gifName, gifFiles, inspectGif],
      [stillName, stillFiles, inspectPng]
    ]) {
      const file = path.join(demosDir, filename);
      const buffer = await readFile(file).catch(() => null);
      assert(buffer?.length > 100, `Missing or empty local guide: public/demos/${filename}`);
      const details = inspector === inspectGif ? inspector(buffer, filename) : await inspector(buffer, filename);
      collection.push({
        file: `/demos/${filename}`,
        bytes: buffer.length,
        sha256: sha256(buffer),
        ...details
      });
    }
  }

  for (const name of expectedPreviews) {
    const filename = `${name}-preview.gif`;
    const relative = `previews/${filename}`;
    const file = path.join(demosDir, relative);
    const buffer = await readFile(file).catch(() => null);
    assert(buffer?.length > 100 && buffer.length <= 120000, `Missing, empty or oversized home preview: public/demos/${relative}`);
    const details = inspectGif(buffer, relative);
    assert(details.width <= 180 && details.height <= 141 && details.frames >= 16, `Home preview ${relative} must remain small and animated`);
    previewGifFiles.push({ file: `/demos/${relative}`, bytes: buffer.length, sha256: sha256(buffer), derivedFrom: `/demos/${name}.gif`, ...details });
  }

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const all = [];
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) all.push(...await walk(full));
      else all.push(full);
    }
    return all;
  }

  const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v']);
  const videos = [];
  for (const file of await walk(publicDir)) {
    if (!videoExtensions.has(path.extname(file).toLowerCase())) continue;
    const buffer = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const valid = ext === '.webm'
      ? buffer.subarray(0, 4).toString('hex') === '1a45dfa3'
      : buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    assert(valid, `${path.relative(publicDir, file)} has an invalid ${ext} signature`);
    videos.push({ file: `/${path.relative(publicDir, file).split(path.sep).join('/')}`, bytes: buffer.length, sha256: sha256(buffer) });
  }

  return { gifFiles, stillFiles, previewGifFiles, videos };
}

const media = await inspectFiles();
const app = await readFile(path.join(publicDir, 'app.js'), 'utf8');
const enhancements = await readFile(path.join(publicDir, 'forge-enhancements.js'), 'utf8');
const serviceWorker = await readFile(path.join(publicDir, 'sw.js'), 'utf8');
const html = await readFile(path.join(publicDir, 'index.html'), 'utf8');
assert(app.includes('/demos/${key}.${paused?\'png\':\'gif\'}'), 'The exercise guide does not point to the local GIF/still files');
assert(serviceWorker.includes("['squat','pushup','row','hinge','bridge','deadbug']"), 'The service worker demo list does not match the six supplied guides');
assert(enhancements.includes('/demos/previews/${key}-preview.gif'), 'The Home card does not point to a local small GIF preview');
assert(serviceWorker.includes("const PREVIEW_GIFS=['squat','pushup','row','hinge','bridge','deadbug'].map(key=>'/demos/previews/'+key+'-preview.gif')"), 'The service worker preview list does not match the Home movement cards');
assert(serviceWorker.includes('...DEMOS,...PREVIEW_GIFS,...FONT_ASSETS'), 'The service worker does not precache the home movement GIF previews');
assert(serviceWorker.includes("'/forge-progress.js'") && serviceWorker.includes("'/media-manifest.json'"), 'The service worker does not precache the progress module and media manifest');
for (const asset of ['/forge-tools.js', '/forge-superset.js', '/forge-reminders.js', '/forge-sync.js', '/forge-game.js', '/supplement-library.js', '/forge-cloud-sync.js', '/forge-enhancements.js', '/forge-extras.css', '/forge-productivity.css', '/equipment/resistance-band-set.svg']) {
  assert((asset.endsWith('.svg') ? app : html).includes(asset), `The app shell or Tools template does not load ${asset}`);
  assert(serviceWorker.includes(`'${asset}'`), `The service worker does not precache ${asset}`);
}
const bandBytes = await readFile(path.join(publicDir, 'equipment/resistance-band-set.svg'));
const bandIllustration = bandBytes.toString('utf8');
assert(bandIllustration.startsWith('<svg '), 'The Forge resistance-band illustration is missing or invalid');
assert(html.includes('/forge-progress.js'), 'The app shell does not load the local progression module');

const report = {
  schemaVersion: 1,
  sourceArchive: 'forge-source.zip (movement media) and FitQuest-complete.zip (audited; reference preview only)',
  note: 'The Forge archive supplies six local movement GIFs and matching stills. Six reduced-size Home preview GIFs are derived from those local originals. The FitQuest archive has one reference webp preview, not runtime media. Neither supplied archive contains video files.',
  equipmentIllustrations: [{ file: '/equipment/resistance-band-set.svg', bytes: bandBytes.length, sha256: sha256(bandBytes), source: 'Original Forge vector inspired by the user-supplied resistance-band product reference; no retailer branding or screenshot included.' }],
  gifs: media.gifFiles,
  previewGifs: media.previewGifFiles,
  stillFrames: media.stillFiles,
  videos: media.videos
};

if (updateManifest) {
  await writeFile(manifestPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, manifestPath)}`);
} else {
  const committed = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert(JSON.stringify(committed) === JSON.stringify(report), 'public/media-manifest.json is stale; regenerate it with npm run media:manifest');
}

console.log(`Verified ${media.gifFiles.length} full guide GIFs (${media.gifFiles.reduce((n, file) => n + file.frames, 0)} total frames), ${media.previewGifFiles.length} small animated previews, ${media.stillFiles.length} still frames, and ${media.videos.length} local videos.`);
