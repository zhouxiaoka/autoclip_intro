#!/usr/bin/env python3
"""Add or refresh one case in the showcase library (cases/<id>/case.json + web media).

From an AutoClip project (completed outputs, with publish-kit copy and covers when present):

    python scripts/add_case.py --id jensen-dwarkesh --scene interview \
        --project ~/.../projects/<project-id> --source-url https://www.youtube.com/watch?v=... \
        --run run.json [--skip <render-job-prefix> ...] [--featured]

From finished files (community submissions, older demos):

    python scripts/add_case.py --id kojima-wired --scene interview --source-url ... \
        --source-title "..." --source-channel WIRED --source-duration 1050 \
        --file "douyin:interview:/path/clip.mp4:第一行|第二行" [--file ...] \
        [--contributor-name someone --contributor-url https://github.com/someone]

Only the standard library and ffmpeg/ffprobe on PATH. Re-running with the same --id replaces the case.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / 'cases'
PLATFORMS = {'douyin', 'xiaohongshu', 'bilibili', 'tiktok', 'instagram_reels', 'youtube_shorts', 'youtube_long'}
TEMPLATES = {'interview', 'podcast', 'original'}
SCENES = {'interview', 'podcast', 'course', 'gameplay', 'talk'}


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)])
    return float(out)


def ffmpeg(*args: str) -> None:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def web_media(master: Path, folder: Path, oid: str) -> dict:
    """Player mp4, 8 s muted loop and poster, all taken around 30% so the packaging is visible."""
    duration = probe_duration(master)
    at = f'{duration * 0.3:.2f}'
    ffmpeg('-i', str(master), '-vf', 'scale=540:-2', '-c:v', 'libx264', '-crf', '29', '-preset', 'slow',
           '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart', str(folder / f'{oid}.mp4'))
    ffmpeg('-ss', at, '-i', str(master), '-t', '8', '-an', '-vf', 'scale=360:-2,fps=24', '-c:v', 'libx264', '-crf', '30',
           '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(folder / f'{oid}-loop.mp4'))
    ffmpeg('-ss', at, '-i', str(master), '-frames:v', '1', '-vf', 'scale=540:-2', '-q:v', '4', str(folder / f'{oid}.jpg'))
    return {'duration_sec': round(duration), 'video': f'{oid}.mp4', 'loop': f'{oid}-loop.mp4', 'poster': f'{oid}.jpg'}


def web_cover(cover: Path, folder: Path, oid: str) -> str:
    ffmpeg('-i', str(cover), '-vf', 'scale=540:-2', '-q:v', '3', str(folder / f'{oid}-cover.jpg'))
    return f'{oid}-cover.jpg'


def template_of(packaging: dict) -> str:
    name = (packaging or {}).get('template') or ''
    return 'interview' if name.startswith('interview') else 'podcast' if name.startswith('podcast') else 'original'


def kit_cover(project: Path, job_id: str, strategy_id: str) -> Path | None:
    folder = project / 'output' / 'covers' / f'studio-{job_id}'
    for meta in sorted(folder.glob('*.json')) if folder.is_dir() else []:
        try:
            if json.loads(meta.read_text()).get('method') in ('model', 'model_bg'):
                image = meta.with_suffix('.jpg')
                if image.is_file():
                    return image
        except (OSError, ValueError):
            pass
    designed = folder / f'kit-{strategy_id}.jpg'
    return designed if designed.is_file() else None


def from_project(project: Path, folder: Path, skip: list[str]) -> tuple[list[dict], dict, dict]:
    state = json.loads((project / 'metadata' / 'studio.json').read_text())
    drafts = {d['id']: d for d in state.get('drafts', [])}
    variants = state.get('output_variants', [])
    rendered = [v for v in variants if v.get('status') == 'completed' and v.get('render_job_id')]
    done = [v for v in rendered if not any(v['render_job_id'].startswith(s) for s in skip)]
    done.sort(key=lambda v: drafts[v['draft_id']]['scenes'][0]['start'])
    outputs = []
    for n, variant in enumerate(done, 1):
        oid, job = f'{n:02d}', variant['render_job_id']
        draft = drafts[variant['draft_id']]
        packaging = draft.get('packaging') or {}
        master = project / 'output' / 'studio' / f'{job}.mp4'
        item = {'id': oid, 'platform': variant['strategy_id'], 'template': template_of(packaging),
                'title_lines': packaging.get('title_lines') or [draft.get('title', '')],
                'source_start_sec': round(draft['scenes'][0]['start']),
                'mood': packaging.get('mood'), 'palette': packaging.get('palette'), **web_media(master, folder, oid)}
        cover = kit_cover(project, job, variant['strategy_id'])
        if cover:
            item['cover'] = web_cover(cover, folder, oid)
        if variant.get('post'):
            item['post'] = {k: variant['post'].get(k) for k in ('title', 'description', 'tags')}
        outputs.append(item)
    counts = {'found': sum(v.get('status') in ('completed', 'on_demand') for v in variants), 'rendered': len(rendered)}
    return outputs, state.get('source_meta') or {}, counts


def from_files(entries: list[str], folder: Path) -> list[dict]:
    outputs = []
    for n, entry in enumerate(entries, 1):
        platform, template, path, *title = entry.split(':', 3)
        if platform not in PLATFORMS or template not in TEMPLATES:
            raise SystemExit(f'--file {entry!r}: 平台须为 {sorted(PLATFORMS)}，模板须为 {sorted(TEMPLATES)}')
        oid = f'{n:02d}'
        lines = [line for line in (title[0].split('|') if title else []) if line]
        outputs.append({'id': oid, 'platform': platform, 'template': template, 'title_lines': lines,
                        **web_media(Path(path).expanduser(), folder, oid)})
    return outputs


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--id', required=True, help='小写字母、数字和连字符，例如 jensen-dwarkesh')
    ap.add_argument('--scene', required=True, choices=sorted(SCENES))
    ap.add_argument('--project', type=Path)
    ap.add_argument('--file', action='append', default=[], help='platform:template:path[:第一行|第二行]')
    ap.add_argument('--skip', action='append', default=[], help='不收录的渲染任务 ID 前缀')
    ap.add_argument('--source-url', required=True)
    ap.add_argument('--source-title')
    ap.add_argument('--source-channel')
    ap.add_argument('--source-duration', type=int, help='原片秒数')
    ap.add_argument('--source-language', default='en')
    ap.add_argument('--run', type=Path, help='实测数据 JSON：minutes、model、model_calls、tokens_in、tokens_out、cost_cny、subtitles')
    ap.add_argument('--contributor-name')
    ap.add_argument('--contributor-url')
    ap.add_argument('--added', default=dt.date.today().isoformat())
    ap.add_argument('--featured', action='store_true')
    args = ap.parse_args()

    if not args.id.replace('-', '').isalnum() or args.id != args.id.lower():
        raise SystemExit('--id 只能用小写字母、数字和连字符')
    if bool(args.project) == bool(args.file):
        raise SystemExit('--project 与 --file 二选一')

    folder = CASES / args.id
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)

    meta, counts = {}, {}
    if args.project:
        outputs, meta, counts = from_project(args.project.expanduser(), folder, args.skip)
    else:
        outputs = from_files(args.file, folder)
    if not outputs:
        raise SystemExit('没有可收录的成片')

    case = {
        'schema': 1, 'id': args.id, 'added': args.added, 'scene': args.scene, 'featured': args.featured,
        'contributor': {'name': args.contributor_name, 'url': args.contributor_url} if args.contributor_name else None,
        'source': {'title': args.source_title or meta.get('title', ''), 'channel': args.source_channel or meta.get('channel', ''),
                   'url': args.source_url, 'duration_sec': args.source_duration, 'language': args.source_language},
        'run': None, 'outputs': outputs,
    }
    if args.run:
        case['run'] = {**json.loads(args.run.read_text()), **counts}
    (folder / 'case.json').write_text(json.dumps(case, ensure_ascii=False, indent=1) + '\n')

    index_path = CASES / 'index.json'
    index = json.loads(index_path.read_text()) if index_path.exists() else {'schema': 1, 'cases': []}
    others = [c for c in index['cases'] if c != args.id]
    added = {c: json.loads((CASES / c / 'case.json').read_text())['added'] for c in others}
    added[args.id] = args.added
    index['cases'] = sorted(added, key=lambda c: (added[c], c == args.id), reverse=True)
    index['updated'] = max(added.values())
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n')
    print(f'{args.id}: {len(outputs)} 条成片 → {folder.relative_to(ROOT)}', file=sys.stderr)


if __name__ == '__main__':
    main()
