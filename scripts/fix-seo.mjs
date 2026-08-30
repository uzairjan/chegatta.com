import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

let fixed = 0;
const issues = [];

for (const file of htmlFiles) {
  let html = readFileSync(file, 'utf8');
  const rel = file.replace(root + '/', '').replace(/\\/g, '/');
  const isRoot = dirname(rel) === '.';
  const lang = html.match(/<html lang="([^"]+)"/)?.[1] || 'en';
  const pageUrl = `https://chegatta.com/${rel}`;

  let changed = false;

  // 1. Fix canonical
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (canonicalMatch && canonicalMatch[1] !== pageUrl) {
    html = html.replace(canonicalMatch[0], `<link rel="canonical" href="${pageUrl}">`);
    changed = true;
    issues.push({ file: rel, issue: 'canonical_mismatch', old: canonicalMatch[1], new: pageUrl });
  }

  // 2. Fix x-default hreflang pointing to homepage
  const xDefaultRegex = /<link rel="alternate" hreflang="x-default" href="https:\/\/chegatta\.com\/"\/>/g;
  if (xDefaultRegex.test(html)) {
    html = html.replace(xDefaultRegex, `<link rel="alternate" hreflang="x-default" href="${pageUrl}">`);
    changed = true;
    issues.push({ file: rel, issue: 'x-default_to_homepage', fix: pageUrl });
  }

  // 3. Add missing ES alternate for PT pages that have EN alternate
  if (lang === 'pt') {
    const hasEs = html.includes('hreflang="es"');
    const hasEn = html.includes('hreflang="en"');
    if (hasEn && !hasEs) {
      const esPath = file.replace(/\/pt\//, '/es/');
      if (existsSync(esPath)) {
        const esUrl = `https://chegatta.com/es/${basename(file)}`;
        html = html.replace('</head>', `    <link rel="alternate" hreflang="es" href="${esUrl}">\n</head>`);
        changed = true;
        issues.push({ file: rel, issue: 'missing_es_alternate', added: esUrl });
      }
    }
  }

  // 4. Add missing PT alternate for ES pages that have EN alternate
  if (lang === 'es') {
    const hasPt = html.includes('hreflang="pt"');
    const hasEn = html.includes('hreflang="en"');
    if (hasEn && !hasPt) {
      const ptPath = file.replace(/\/es\//, '/pt/');
      if (existsSync(ptPath)) {
        const ptUrl = `https://chegatta.com/pt/${basename(file)}`;
        html = html.replace('</head>', `    <link rel="alternate" hreflang="pt" href="${ptUrl}">\n</head>`);
        changed = true;
        issues.push({ file: rel, issue: 'missing_pt_alternate', added: ptUrl });
      }
    }
  }

  // 5. Ensure all images have alt and lazy loading
  const imgRegex = /<img([^>]+)>/g;
  let imgChanged = false;
  html = html.replace(imgRegex, (match, attrs) => {
    let newAttrs = attrs;
    if (!/alt=/.test(newAttrs)) {
      newAttrs += ' alt="Chegatta"';
      imgChanged = true;
    }
    if (!/loading=/.test(newAttrs)) {
      newAttrs += ' loading="lazy"';
      imgChanged = true;
    }
    return `<img${newAttrs}>`;
  });
  if (imgChanged) {
    changed = true;
    issues.push({ file: rel, issue: 'image_alt_or_lazy' });
  }

  // 6. Add BreadcrumbList schema if missing
  if (!html.includes('BreadcrumbList')) {
    const pageName = basename(file).replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://chegatta.com/" },
        { "@type": "ListItem", "position": 2, "name": pageName, "item": pageUrl }
      ]
    };
    const schemaJson = JSON.stringify(breadcrumbSchema, null, 4);
    html = html.replace('</head>', `    <script type="application/ld+json">\n${schemaJson}\n    </script>\n</head>`);
    changed = true;
    issues.push({ file: rel, issue: 'added_breadcrumb_schema' });
  }

  // 7. Ensure meta description exists
  if (!html.includes('<meta name="description"')) {
    const desc = `Chegatta — ${basename(file).replace('.html', '').replace(/-/g, ' ')}`;
    html = html.replace('</head>', `    <meta name="description" content="${desc}">\n</head>`);
    changed = true;
    issues.push({ file: rel, issue: 'added_meta_description' });
  }

  if (changed) {
    writeFileSync(file, html);
    fixed++;
  }
}

console.log(`Fixed ${fixed} HTML files`);

// 8. Fix sitemap.xml
const sitemapXml = join(root, 'sitemap.xml');
if (existsSync(sitemapXml)) {
  let sitemap = readFileSync(sitemapXml, 'utf8');
  
  // Fix x-default URLs - replace homepage with actual page URLs
  // Each <url> block has a <loc> that we can use to fix the x-default
  sitemap = sitemap.replace(/(<url>[\s\S]*?<loc>)([^<]+)(<\/loc>[\s\S]*?<xhtml:link rel="alternate" hreflang="x-default" href=")https:\/\/chegatta\.com\/("\/>)/g, 
    (match, start, url, mid, prefix, end) => {
      return `${start}${url}${mid}${url}${end}`;
    });
  
  // Fix formatting
  sitemap = sitemap.replace(/<url>\n\s+<loc>/g, '  <url>\n    <loc>');
  sitemap = sitemap.replace(/<\/url>\n\s+<url>/g, '  </url>\n  <url>');
  
  writeFileSync(sitemapXml, sitemap);
  console.log('Fixed sitemap.xml');
}

// 9. Update sitemap-pt.xml to be a sitemap index pointing to sitemap.xml
const sitemapPt = join(root, 'sitemap-pt.xml');
if (existsSync(sitemapPt)) {
  const today = new Date().toISOString().split('T')[0];
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://chegatta.com/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  writeFileSync(sitemapPt, index);
  console.log('Replaced sitemap-pt.xml with sitemap index');
}

// 10. Update robots.txt
const robotsTxt = join(root, 'robots.txt');
if (existsSync(robotsTxt)) {
  let robots = readFileSync(robotsTxt, 'utf8');
  // Keep only one sitemap reference
  robots = robots.replace(/Sitemap: https:\/\/chegatta\.com\/sitemap\.xml\n/, '');
  robots = robots.replace(/Sitemap: https:\/\/chegatta\.com\/sitemap-pt\.xml\n/, '');
  robots = robots.trim() + '\n\nSitemap: https://chegatta.com/sitemap.xml\n';
  writeFileSync(robotsTxt, robots);
  console.log('Updated robots.txt');
}

console.log('\nSummary:');
console.log(`  HTML files fixed: ${fixed}`);
console.log(`  Issues found: ${issues.length}`);
issues.forEach(i => console.log(`  ${i.file}: ${i.issue}`));
