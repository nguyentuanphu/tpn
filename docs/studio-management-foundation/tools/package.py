#!/usr/bin/env python3
"""Create and verify an offline documentation ZIP; refuses to overwrite a file."""
from pathlib import Path
import hashlib, sys, zipfile

root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 docs/studio-management-foundation/tools/package.py /absolute/path/new-bundle.zip')
output=Path(sys.argv[1]).expanduser().resolve()
if output==root or root in output.parents:
    raise SystemExit('Choose an output outside this documentation folder.')
if output.exists():raise SystemExit('Refusing to overwrite existing file: '+str(output))
files=sorted(p for p in root.rglob('*') if p.is_file() and p.name!='MANIFEST.sha256' and '__pycache__' not in p.parts)
manifest={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(root/'MANIFEST.sha256').write_text(''.join(digest+'  '+name+'\n' for name,digest in manifest.items()))
files.append(root/'MANIFEST.sha256')
with zipfile.ZipFile(output,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for file in files:archive.write(file,root.name+'/'+file.relative_to(root).as_posix())
with zipfile.ZipFile(output) as archive:
    if archive.testzip() is not None:raise SystemExit('ZIP integrity check failed')
    for name,digest in manifest.items():
        if hashlib.sha256(archive.read(root.name+'/'+name)).hexdigest()!=digest:
            raise SystemExit('ZIP content hash mismatch: '+name)
print('Verified ZIP:',output)
print('Files:',len(files),'Bytes:',output.stat().st_size)
print('SHA256:',hashlib.sha256(output.read_bytes()).hexdigest())
