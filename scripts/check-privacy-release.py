"""Read-only release preflight. A local draft must never be published."""
from pathlib import Path
import json
root = Path(__file__).resolve().parent.parent
status = json.loads((root / 'docs/privacy-release-status.json').read_text())
page = (root / 'privacy/index.html').read_text()
if status.get('ready') is not True or any(marker in page for marker in ['TE BEVESTIGEN', 'LOKAAL CONCEPT', 'NIET PUBLICEREN']):
    raise SystemExit('Privacy release blocked: unresolved factual review. No public assets changed.')
if (root / 'privacy-booking-studio/index.html').exists() and 'privacy/' in (root / '.assetsignore').read_text().splitlines():
    raise SystemExit('Privacy release blocked: privacy/ is still excluded from static assets.')
print('Privacy factual review and public route preflight passed.')
