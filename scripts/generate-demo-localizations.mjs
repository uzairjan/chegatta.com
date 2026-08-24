/*
 * Generates localized demo pages (es/demo.html, pt/demo.html) from the
 * English source demo.html (10-scenario version).
 *
 * Translations live in ./demo-translations.es.mjs and ./.demo-translations.pt.mjs.
 * Usage:  node scripts/generate-demo-localizations.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import esDict from './demo-translations.es.mjs';
import ptDict from './demo-translations.pt.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const enSource = readFileSync(resolve(root, 'demo.html'), 'utf8');

const dictionaries = { es: esDict, pt: ptDict };

/* Apply a dictionary to a string, longest keys first to avoid overlaps. */
function applyDict(html, dict) {
  const sorted = [...dict].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    if (!from) continue;
    html = html.split(from).join(to); // literal, global replace
  }
  return html;
}

/* Prefix root-relative href/src values with ../ so they resolve from a subdir. */
function prefixRelativePaths(html) {
  return html.replace(
    /(\bhref|src)="((?!https?:[\/][/]|mailto:|tel:|#|\.\.?\/|data:|file:)[^"]+)"/g,
    (match, attr, val) => `${attr}="../${val}"`,
  );
}

for (const [lang, dict] of Object.entries(dictionaries)) {
  let out = applyDict(enSource, dict);

  // 1. <html lang>
  out = out.replace(/(<html lang=")[a-z]+(")/, `$1${lang}$2`);

  // 2. canonical / og:url / JSON-LD url -> localized page (hreflang alternates untouched)
  out = out.replace(
    /<link rel="canonical" href="https:\/\/chegatta\.com\/demo\.html">/,
    `<link rel="canonical" href="https://chegatta.com/${lang}/demo.html">`,
  );
  out = out.replace(
    /<meta property="og:url" content="https:\/\/chegatta\.com\/demo\.html">/,
    `<meta property="og:url" content="https://chegatta.com/${lang}/demo.html">`,
  );
  out = out.replace(
    /"url":"https:\/\/chegatta\.com\/demo\.html"/,
    `"url":"https://chegatta.com/${lang}/demo.html"`,
  );

  // 3. prefix relative paths for the subdir location
  out = prefixRelativePaths(out);

  // 4. same-dir links back to the localized demo page (nav active + footer active + plain lis)
  out = out.replaceAll('../demo.html', 'demo.html');

  // 5. footer language switcher must point across languages
  const langLinks = `href="../demo.html" class="active">EN</a> \u2022 <a href="../pt/demo.html">PT</a> \u2022 <a href="../es/demo.html">ES</a>`;
  if (lang === 'es') {
    out = out.replaceAll('href="demo.html" class="active">EN</a>', 'href="../demo.html">EN</a>');
    out = out.replace('<a href="../es/demo.html">ES</a>', '<a href="../es/demo.html" class="active">ES</a>');
  } else if (lang === 'pt') {
    out = out.replaceAll('href="demo.html" class="active">EN</a>', 'href="../demo.html">EN</a>');
    out = out.replace('<a href="../pt/demo.html">PT</a>', '<a href="../pt/demo.html" class="active">PT</a>');
  }
  void langLinks;

  writeFileSync(resolve(root, lang, 'demo.html'), out, 'utf8');
  console.log(`Wrote ${lang}/demo.html (${out.length} bytes)`);
}
