#!/usr/bin/env python3
"""Rebuild the case library from cases/manifest.json (one command per demo batch).

    python3 scripts/build_cases.py                 # rebuild every case in the manifest
    python3 scripts/build_cases.py tim-luoyonghao  # rebuild only these ids
    python3 scripts/build_cases.py --prune         # also delete case folders no longer in the manifest

`{projects}` / `{demos}` in paths expand to projects_root / demos_root, which may use
${VAR:-default}. Run data comes from data/benchmarks.json via each case's `benchmark` id,
so one measured run feeds the homepage numbers and the case card alike.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from add_case import CASES, build_case, write_index  # noqa: E402


def expand(value: str) -> str:
    value = re.sub(r'\$\{(\w+):-([^}]*)\}', lambda m: os.environ.get(m.group(1), m.group(2)), value)
    return os.path.expandvars(value)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('ids', nargs='*')
    ap.add_argument('--prune', action='store_true')
    args = ap.parse_args()
    manifest = json.loads((CASES / 'manifest.json').read_text())
    roots = {'projects': expand(manifest.get('projects_root', '')), 'demos': expand(manifest.get('demos_root', ''))}
    fill = lambda s: s.format(**roots)
    wanted = set(args.ids) or {c['id'] for c in manifest['cases']}
    unknown = wanted - {c['id'] for c in manifest['cases']}
    if unknown:
        raise SystemExit(f'manifest 里没有：{sorted(unknown)}')
    for spec in manifest['cases']:
        if spec['id'] not in wanted:
            continue
        spec = {**spec, 'project': fill(spec['project']) if spec.get('project') else None,
                'files': [fill(f) for f in spec.get('files', [])]}
        build_case(spec)
    if args.prune:
        keep = {c['id'] for c in manifest['cases']}
        for folder in CASES.iterdir():
            if folder.is_dir() and folder.name not in keep:
                shutil.rmtree(folder)
                print(f'removed {folder.name}', file=sys.stderr)
    index = write_index(manifest.get('batch'), expand(manifest.get('media_base', '')))
    print(f"batch {index['batch']}: {len(index['cases'])} cases", file=sys.stderr)


if __name__ == '__main__':
    main()
