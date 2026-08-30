import { readFileSync, writeFileSync } from 'fs';

const sitemap = readFileSync('/Users/muhammaduzair/www/chegatta.com/sitemap.xml', 'utf8');

// Replace x-default href="https://chegatta.com/" with the actual loc URL from the same <url> block
const fixed = sitemap.replace(/(<url>[\s\S]*?<loc>)([^<]+)(<\/loc>[\s\S]*?<xhtml:link rel="alternate" hreflang="x-default" href=")https:\/\/chegatta\.com\/("\/>)/g, 
  (match, start, url, mid, prefix, end) => {
    return `${start}${url}${mid}${url}${end}`;
  });

writeFileSync('/Users/muhammaduzair/www/chegatta.com/sitemap.xml', fixed);
console.log('Fixed sitemap.xml x-default URLs');
