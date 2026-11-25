"""Verify payloads after cloning and git lfs pull, using only Python stdlib."""
import csv
import hashlib
from pathlib import Path

root=Path(__file__).resolve().parents[2]
with (root/'docs/ASSET_INVENTORY.csv').open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.DictReader(f))
errors=[]
for row in rows:
    path=root/row['path']
    if not path.is_file():
        errors.append('missing '+row['path'])
        continue
    data=path.read_bytes()
    if row['normalization']=='LF':
        data=data.replace(b'\r\n',b'\n')
    if len(data)!=int(row['bytes']) or hashlib.sha256(data).hexdigest()!=row['sha256']:
        errors.append('checksum '+row['path'])
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Verified {len(rows)} archived files.')
