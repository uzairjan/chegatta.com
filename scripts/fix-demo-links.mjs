/*
 * One-off fixes for the demo page launch:
 *  1. Remove broken "Careers" footer links (no careers.html exists).
 *  2. Point "Blog" footer links at blog.html (blog/index.html does not exist).
 *  3. Insert a "Demo" <li> after every Pricing <li> (navbar + footer Product
 *     column) on every page.
 * Idempotent: safe to re-run.
 *
 * Usage: node scripts/fix-demo-links.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dirs = ['.', 'pt', 'es'];

const DEMO_LI = '<li><a href="demo.html">Demo</a></li>';

let changedFiles = 0;

for (const dir of dirs) {
  const files = readdirSync(join(root, dir)).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const path = join(root, dir, file);
    let html = readFileSync(path, 'utf8');
    const before = html;

    // 1. drop broken Careers link (any href form)
    html = html.replace(/^[ \t]*<li><a href="(?:\.\.\/)?careers\.html">[^<]+<\/a><\/li>\r?\n/m, '');

    // 2. fix Blog footer link target
    html = html.replaceAll('href="../blog/index.html"', 'href="../blog.html"');
    html = html.replaceAll('href="blog/index.html"', 'href="blog.html"');

    // 3. add Demo link after EVERY Pricing <li> (navbar + footer Product column).
    //    Strip previously inserted plain Demo <li> lines first so this is idempotent
    //    (the active-state link on the demo pages carries class="active" and is kept).
    html = html.replace(/^[ \t]*<li><a href="demo.html">Demo<\/a><\/li>\r?\n/gm, '');
    html = html.replace(
      /^([ \t]*<li><a href="(?:\.\.\/)?pricing\.html">[^<]+<\/a><\/li>)[ \t]*$/gm,
      (match, li, offset, str) => {
        const lineStart = str.lastIndexOf('\n', offset) + 1;
        const lead = str.slice(lineStart, offset);
        return `${match}\n${lead}${DEMO_LI}`;
      },
    );

    if (html !== before) {
      writeFileSync(path, html, 'utf8');
      changedFiles++;
      console.log(`updated ${dir === '.' ? file : `${dir}/${file}`}`);
    }
  }
}
console.log(`Done. ${changedFiles} file(s) changed.`);
