import { readFileSync, writeFileSync } from 'fs';

const sitemap = readFileSync('/Users/muhammaduzair/www/chegatta.com/sitemap.xml', 'utf8');

// Fix corrupted x-default URLs that have extra numbers appended
const fixed = sitemap.replace(
  /(xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/chegatta\.com\/[^"]+?)(\d+)(?![^<]*>)/g,
  (match, url, numbers) => {
    return `${url}"/>`;
  }
);

writeFileSync('/Users/muhammaduzair/www/chegatta.com/sitemap.xml', fixed);
console.log('Fixed corrupted sitemap URLs');

// Verify
const check = readFileSync('/Users/muhammaduzair/www/chegatta.com/sitemap.xml', 'utf8');
const broken = check.match(/x-default.*href="https:\/\/chegatta\.com\/[^"]*\d{3,}/g);
if (broken) {
  console.log('Still broken:', broken.length);
} else {
  console.log('All x-default URLs look clean');
}
