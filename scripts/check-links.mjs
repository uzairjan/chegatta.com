import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const root = '/Users/muhammaduzair/www/chegatta.com';
const htmlFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const broken = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = file.replace(root + '/', '');
  const base = dirname(file);
  
  // Find all local href links
  const hrefRegex = /href="([^"]+\.html)"/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    // Skip external links and anchors
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    
    // Resolve relative path
    const target = join(base, href);
    if (!existsSync(target)) {
      broken.push({ from: rel, to: href });
    }
  }
}

console.log(`Broken links: ${broken.length}`);
broken.forEach(b => console.log(`  ${b.from} -> ${b.to}`));
