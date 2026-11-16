// Dev helper: node snap.mjs <outDir> t1 t2 ... -> PNG stills at those times
import puppeteer from 'puppeteer-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const [dir, ...times] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.setViewport({ width: 1080, height: 1920 });
await page.goto(pathToFileURL(path.join(here, process.env.PAGE || 'promo.html')).href + '?render');
await page.evaluate(() => window.READY);
for (const t of times) {
  const b64 = await page.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', .8).split(',')[1]; }, +t);
  fs.writeFileSync(path.join(dir, `t${t}.jpg`), Buffer.from(b64, 'base64'));
}
await browser.close();
console.log(errs.length ? errs.join('\n') : 'ok');
