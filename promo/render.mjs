// Renders promo.html frame by frame in headless Chrome and pipes the frames to ffmpeg.
// Usage: node render.mjs [--page=kaizo.html] [--audio=song.mp3] [--start=12.5] [--out=out/fits-promo.mp4] [--chrome=path] [--frames=0-120]
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));
const out = path.resolve(args.out || path.join(here, 'out', 'fits-promo.mp4'));
fs.mkdirSync(path.dirname(out), { recursive: true });
const chrome = args.chrome || process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920 });
await page.goto(pathToFileURL(path.join(here, args.page || 'promo.html')).href + '?render');
await page.evaluate(() => window.READY || document.fonts.ready);
const { fps, dur } = await page.evaluate(() => ({ fps: window.FPS, dur: window.DUR }));

const total = Math.round(fps * dur);
const [f0, f1] = args.frames ? String(args.frames).split('-').map(Number) : [0, total];
const length = (f1 - f0) / fps;

const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-'];
if (args.audio) ff.push('-ss', String(Number(args.start || 0) + f0 / fps), '-i', path.resolve(args.audio));
ff.push('-map', '0:v');
if (args.audio) ff.push('-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-af', `afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, length - 1.5)}:d=1.5`);
ff.push('-t', String(length), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => proc.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited with ' + c))));

for (let i = f0; i < f1; i++) {
  const b64 = await page.evaluate(t => {
    window.renderAt(t);
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, i / fps);
  if (!proc.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => proc.stdin.once('drain', r));
  if (i % 30 === 0) process.stdout.write(`\rframe ${i}/${f1}`);
}
proc.stdin.end();
await done;
await browser.close();
console.log(`\nwrote ${out}`);
