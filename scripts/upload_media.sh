#!/usr/bin/env bash
# Upload case media to object storage (Cloudflare R2 by default) and point the site at it.
#   rclone config  →  add an "r2" remote (S3, provider Cloudflare, your account endpoint)
#   AUTOCLIP_MEDIA_BASE=https://media.example.com/cases/ scripts/upload_media.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="${AUTOCLIP_MEDIA_REMOTE:-r2:autoclip-media/cases}"
: "${AUTOCLIP_MEDIA_BASE:?set AUTOCLIP_MEDIA_BASE to the public URL of $REMOTE, ending with /}"
rclone copy cases "$REMOTE" --include "*/*.mp4" --include "*/*.jpg" \
  --header-upload "Cache-Control: public, max-age=31536000, immutable" --progress
python3 - <<'PY'
import json, os
from pathlib import Path
p = Path('cases/index.json'); index = json.loads(p.read_text())
index['media_base'] = os.environ['AUTOCLIP_MEDIA_BASE']
p.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n')
print('media_base →', index['media_base'])
PY
