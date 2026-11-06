#!/usr/bin/env bash
# The npm registry stops at SheetJS 0.18.5, which has known security problems (CVE-2023-30533,
# CVE-2024-22363). The fixed builds are published only on SheetJS's own site, so CI puts the
# official file in place before testing and packaging. Fails rather than ship the old one.
set -euo pipefail
VERSION=0.20.3
URL="https://cdn.sheetjs.com/xlsx-${VERSION}/package/dist/xlsx.full.min.js"
curl -fsSL --retry 3 "$URL" -o web/vendor/xlsx.full.min.js
sed -i.bak '/^\/\/# sourceMappingURL=/d' web/vendor/xlsx.full.min.js && rm -f web/vendor/xlsx.full.min.js.bak
test "$(wc -c < web/vendor/xlsx.full.min.js)" -gt 100000
echo "SheetJS ${VERSION} in place"
