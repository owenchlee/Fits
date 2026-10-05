// Regenerates src/lib/generated/licenses.json — the third-party notices shown at /licenses.
// Run after adding or upgrading a runtime dependency:  npm run licenses
//
// Walks the installed dependency tree from the packages that actually ship to users (the browser
// bundle and the native shells), skipping build tooling, and records each package's license and
// its license file text (which MIT/BSD/ISC/Apache require to accompany redistributed copies).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

/** Runtime dependencies that are build/dev tooling despite living in `dependencies`. */
const NOT_SHIPPED = new Set(["@capacitor/cli", "shadcn", "server-only"]);
/** Optional native binaries Next pulls in for the build/server, never shipped to devices. */
const SKIP_PATTERN = /^(@next\/swc-|@img\/|sharp$|@esbuild\/|esbuild$|typescript$|caniuse-lite$)/;

function readPackage(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  } catch {
    return null;
  }
}

/** Node-style resolution: look in nested node_modules first, then walk up. */
function resolveDir(name, fromDir) {
  let dir = fromDir;
  while (true) {
    const candidate = path.join(dir, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function licenseText(dir) {
  const file = fs.readdirSync(dir).find((f) => /^(licen[cs]e|copying|notice)(\.|-|$)/i.test(f));
  return file ? fs.readFileSync(path.join(dir, file), "utf8").trim() : null;
}

function repoUrl(p) {
  const repo = typeof p.repository === "string" ? p.repository : p.repository?.url;
  if (!repo) return p.homepage ?? null;
  return repo
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^github:/, "https://github.com/")
    .replace(/^(?!https?:)([\w-]+\/[\w.-]+)$/, "https://github.com/$1");
}

const seen = new Map();
const queue = Object.keys(pkg.dependencies)
  .filter((name) => !NOT_SHIPPED.has(name))
  .map((name) => ({ name, from: root }));

while (queue.length) {
  const { name, from } = queue.shift();
  if (SKIP_PATTERN.test(name)) continue;
  const dir = resolveDir(name, from);
  if (!dir) continue;
  const p = readPackage(dir);
  if (!p) continue;
  const key = `${p.name}@${p.version}`;
  if (seen.has(key)) continue;
  seen.set(key, {
    name: p.name,
    version: p.version,
    license: typeof p.license === "string" ? p.license : p.license?.type ?? "See license text",
    url: repoUrl(p),
    text: licenseText(dir),
  });
  for (const dep of Object.keys(p.dependencies ?? {})) queue.push({ name: dep, from: dir });
}

// Fonts are bundled by next/font at build time rather than through a package dependency.
const fonts = ["Inter", "Barlow Condensed", "JetBrains Mono"].map((family) => ({
  name: `${family} (font)`,
  version: "",
  license: "OFL-1.1",
  url: `https://fonts.google.com/specimen/${family.replace(/ /g, "+")}`,
  text: null,
}));

// Many packages share identical license text; store each distinct text once.
const texts = [];
const textIndex = new Map();
const packages = [...seen.values(), ...fonts]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(({ text, ...rest }) => {
    let textId = null;
    if (text) {
      if (!textIndex.has(text)) {
        textIndex.set(text, texts.length);
        texts.push(text);
      }
      textId = textIndex.get(text);
    }
    return { ...rest, textId };
  });

const outDir = path.join(root, "src", "lib", "generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "licenses.json"), JSON.stringify({ packages, texts }) + "\n");
console.log(`Wrote ${packages.length} packages (${texts.length} distinct license texts) to src/lib/generated/licenses.json`);
