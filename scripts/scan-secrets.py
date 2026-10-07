#!/usr/bin/env python3
"""Conservative credential check. Prints paths/rule names only, never matched values.
Use --history for every reachable Git revision. CI also runs Gitleaks.
"""
import re, subprocess, sys
from pathlib import Path
patterns = {
    'private-key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'provider-key': re.compile(rb'\b(?:sk_(?:live|test)_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{32,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16})\b'),
    'embedded-password': re.compile(rb'(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:/]+:([^\s@]{8,})@'),
    'secret-assignment': re.compile(rb'(?:ZAI_API_KEY|WORKOS_API_KEY|WORKOS_COOKIE_PASSWORD|CONVEX_DEPLOY_KEY|ANALYSIS_SERVER_SECRET|ANALYSIS_IP_SALT)\s*[=:]\s*[\x22\x27]?([A-Za-z0-9._|:-]{24,})'),
}
ignored_values = re.compile(rb'replace|example|placeholder|xxxx', re.I)
failures = set()
def inspect(label, data):
    for rule, pattern in patterns.items():
        for match in pattern.finditer(data):
            if not ignored_values.search(match.group(0)):
                failures.add((label,rule))
files=subprocess.check_output(['git','ls-files','-co','--exclude-standard','-z']).split(b'\0')
for name in set(files):
    if not name: continue
    path=Path(name.decode())
    if path.is_file(): inspect(str(path),path.read_bytes())
if '--history' in sys.argv:
    objects=subprocess.check_output(['git','rev-list','--objects','--all']).decode().splitlines()
    for entry in objects:
        parts=entry.split(' ',1)
        if len(parts)!=2: continue
        oid,path=parts
        kind=subprocess.check_output(['git','cat-file','-t',oid]).strip()
        if kind==b'blob': inspect('history:'+path,subprocess.check_output(['git','cat-file','blob',oid]))
for path,rule in sorted(failures): print(f'{rule}: {path}')
print(f'Credential scan: {len(failures)} finding(s). Values redacted. Heuristic checks are not proof of absence.')
sys.exit(bool(failures))
