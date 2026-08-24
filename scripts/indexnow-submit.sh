#!/bin/bash
# Submits all site URLs to IndexNow (Bing/Seznam/Yandex push indexing).
# The key file must exist at the site root and be deployed before running.
# Usage: bash scripts/indexnow-submit.sh [sitemap1.xml sitemap2.xml ...]
set -euo pipefail

cd "$(dirname "$0")/.."
KEY=$(tr -d '[:space:]' < indexnow-key.txt)
HOST="chegatta.com"
export KEY HOST
SITEMAPS=("$@")

if [ ${#SITEMAPS[@]} -eq 0 ]; then
    SITEMAPS=(sitemap.xml sitemap-pt.xml)
fi

# Collect unique <loc> URLs from the given (local) sitemap files
URLS=$(python3 - "${SITEMAPS[@]}" <<'PY'
import re, sys
urls = set()
for f in sys.argv[1:]:
    urls.update(re.findall(r'<loc>(.*?)</loc>', open(f).read()))
for u in sorted(urls):
    if u.startswith('https://' + __import__('os').environ.get('HOST', 'chegatta.com')):
        print(u)
PY
)

COUNT=$(echo "$URLS" | grep -c .)
BODY=$(python3 -c "
import json, sys, os
urls = [l.strip() for l in sys.stdin if l.strip()]
print(json.dumps({
    'host': os.environ['HOST'],
    'key': os.environ['KEY'],
    'urlList': urls,
}, indent=None))
" <<< "$URLS")

echo "Submitting $COUNT URLs to IndexNow..."
RESPONSE=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -H 'Content-Type: application/json; charset=utf-8' \
    -d "$BODY" \
    'https://api.indexnow.org/indexnow')

case "$RESPONSE" in
    200|202) echo "OK ($RESPONSE): URLs accepted for indexing" ;;
    400)     echo "FAILED (400): invalid request" >&2; exit 1 ;;
    403)     echo "FAILED (403): key not valid (is $KEY.txt deployed at the site root?)" >&2; exit 1 ;;
    422)     echo "FAILED (422): URLs do not belong to host or key mismatch" >&2; exit 1 ;;
    429)     echo "FAILED (429): too many requests, retry later" >&2; exit 1 ;;
    *)       echo "Unexpected response: $RESPONSE" >&2; exit 1 ;;
esac