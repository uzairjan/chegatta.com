#!/bin/bash
SITEMAP="$HOME/www/chegatta.com/sitemap.xml"
TMP=$(mktemp)

# Process each <url> block, fix x-default to match <loc>
awk '
/<url>/{block=""}
{block=block $0 "\n"}
/<\/url>/{
  if (match(block, /<loc>([^<]+)<\/loc>/, arr)) {
    loc=arr[1];
    gsub(/href="https:\/\/chegatta\.com\/"\/>/, "href=\"" loc "\"/>", block);
  }
  printf "%s", block;
  block="";
}
' "$SITEMAP" > "$TMP"

mv "$TMP" "$SITEMAP"
echo "Fixed sitemap.xml x-default URLs"
