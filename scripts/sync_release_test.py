import re
import tempfile
import unittest
import urllib.error
from pathlib import Path

from sync_release import (
    fetch_release,
    patch_game_streams,
    patch_index,
    patch_llms,
    patch_llms_full,
    patch_publish,
    pick_assets,
    render,
    require_stable,
)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = {
    "mac": {"name": "AutoClip.Desktop_9.9.9_aarch64.dmg", "bytes": 1, "size_mb": 11, "url": "https://example.test/mac"},
    "win": {"name": "AutoClip.Desktop_9.9.9_x64-setup.exe", "bytes": 1, "size_mb": 22, "url": "https://example.test/win"},
}

INDEX_SAMPLE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<script type="application/ld+json">
{"@graph": [{"@type": "SoftwareApplication", "softwareVersion": "1.5.8"}]}
</script>
</head>
<body>
<noscript>
  <p>当前版本 1.5.8，支持 Windows 与 macOS Apple Silicon。</p>
  <p lang="en">v1.5.8 for Windows and Apple Silicon Mac.</p>
</noscript>
<a id="cta-primary" href="https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/AutoClip.Desktop_1.5.8_aarch64.dmg">Download</a>
<a id="cta-alt" href="https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/AutoClip.Desktop_1.5.8_x64-setup.exe">Windows</a>
<span class="mono" data-i18n="hero.note">v1.5.8 · 开源 MIT · 免费</span>
<p><span>AutoClip 1.5.0</span></p>
<div class="dl">
  <span class="ver">v1.5.8 · 348 MB</span>
  <a href="https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/AutoClip.Desktop_1.5.8_aarch64.dmg">下载 .dmg</a>
  <span class="ver">v1.5.8 · 195 MB</span>
  <a href="https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/AutoClip.Desktop_1.5.8_x64-setup.exe">下载安装包</a>
</div>
<script>
  var REL = 'https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/';
  var MAC = REL + 'AutoClip.Desktop_1.5.8_aarch64.dmg';
  var WIN = REL + 'AutoClip.Desktop_1.5.8_x64-setup.exe';
  var T = {
    zh: {'hero.note':'v1.5.8 · 开源 MIT · 免费'},
    en: {'hero.note':'v1.5.8 · Open source, MIT · Free'}
  };
</script>
</body>
</html>
"""

PUBLISH_SAMPLE = """<p class="fine" data-i18n="hero.ver">发布与自动封面自 v1.3.2 起可用。下载用当前正式版（现为 v1.5.0）。</p>
<script>
const COPY = {
  zh: {'hero.ver':'发布与自动封面自 v1.3.2 起可用。下载用当前正式版（现为 v1.5.0）。'},
  en: {'hero.ver':'Publish and auto-cover have been available since v1.3.2. Download the current release (v1.5.0).'},
  ja: {'hero.ver':'公開と自動カバーは v1.3.2 から使えます。ダウンロードは現行の正式版（現在 v1.5.0）です。'},
  ko: {'hero.ver':'게시와 자동 커버는 v1.3.2부터 사용할 수 있습니다. 다운로드는 현재 정식판(지금 v1.5.0)입니다。'},
  es: {'hero.ver':'Publicar y la portada automática están disponibles desde v1.3.2. Descarga la versión actual (v1.5.0).'},
  pt: {'hero.ver':'Publicar e a capa automática existem desde o v1.3.2. Baixe a versão atual (v1.5.0).'},
  ru: {'hero.ver':'Публикация и автообложка доступны с v1.3.2. Скачайте актуальный релиз (сейчас v1.5.0).'},
  fr: {'hero.ver':'La publication et la couverture auto sont là depuis la v1.3.2. Téléchargez la version actuelle (v1.5.0).'}
};
</script>
"""

LLMS_SAMPLE = """AutoClip is not a hosted clipper. Version 1.5.0 ships a desktop app (Windows x64, macOS Apple Silicon).
See the official 1.5.0 first-run case.
剪辑和渲染在你的电脑上。1.5.0 同时提供 Windows / macOS 桌面版、CLI 和 MCP。
"""

LLMS_FULL_SAMPLE = """# AutoClip — Full Product Brief
Updated: 2026-10-01

## Current product (1.5.0)
| Installers | Self-contained (Python + FFmpeg bundled). macOS ~340 MB, Windows ~190 MB |
Official AutoClip 1.5.0 first-run case on the same 1.5 pipeline.
云端转写会发送音频。1.5.0 提供 Windows x64 与 macOS Apple Silicon 桌面版。
"""

GAME_STREAMS_SAMPLE = """<section class="hero">
  <span class="badge badge-soon" data-copy="hero.soon">v1.6.0 即将发布</span>
</section>
<div class="dl">
  <div class="dlcard" id="dl-card-mac">
    <span class="ver">v1.5.8 · 348 MB</span>
    <a id="dl-mac-btn" href="https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/AutoClip.Desktop_1.5.8_aarch64.dmg">先下载 macOS 版 (.dmg)</a>
  </div>
  <div class="dlcard" id="dl-card-win">
    <span class="ver">v1.5.8 · 195 MB</span>
    <a id="dl-win-btn" href="https://github.com/zhouxiaoka/autoclip/releases/download/v1.5.8/AutoClip.Desktop_1.5.8_x64-setup.exe">先下载 Windows 版 (.exe)</a>
  </div>
</div>
"""


def release(tag="v1.5.8", **extra):
    ver = tag.removeprefix("v")
    payload = {
        "tag_name": tag,
        "draft": False,
        "prerelease": False,
        "published_at": "2026-11-02T12:15:50Z",
        "html_url": f"https://github.com/zhouxiaoka/autoclip/releases/tag/{tag}",
        "assets": [
            {"name": f"AutoClip.Desktop_{ver}_aarch64.dmg", "size": 348 * 1024 * 1024, "browser_download_url": "https://example.test/mac"},
            {"name": f"AutoClip.Desktop_{ver}_x64-setup.exe", "size": 195 * 1024 * 1024, "browser_download_url": "https://example.test/win"},
        ],
    }
    payload.update(extra)
    return payload


class StableReleaseGate(unittest.TestCase):
    def test_latest_shape_is_accepted(self):
        self.assertEqual(require_stable(release(), None), "1.5.8")

    def test_prerelease_and_draft_are_refused(self):
        for flag in ("prerelease", "draft"):
            with self.assertRaises(SystemExit) as caught:
                require_stable(release(**{flag: True}), None)
            self.assertIn("页面保持原样", str(caught.exception))

    def test_explicit_rc_tag_is_refused_even_with_installers(self):
        with self.assertRaises(SystemExit):
            require_stable(release("v1.5.9", prerelease=True), "v1.5.9")

    def test_missing_platform_asset_is_refused(self):
        payload = release()
        payload["assets"] = payload["assets"][:1]
        with self.assertRaises(SystemExit) as caught:
            pick_assets(payload, "1.5.8")
        self.assertIn("缺少桌面安装包", str(caught.exception))

    def test_api_outage_and_prerelease_leave_the_tree_untouched(self):
        root = Path(tempfile.mkdtemp())
        (root / "index.html").write_text("UNTOUCHED", encoding="utf-8")

        def offline(*_args, **_kwargs):
            raise urllib.error.URLError("offline")

        with self.assertRaises(SystemExit) as caught:
            fetch_release(None, opener=offline)
        self.assertIn("页面保持原样", str(caught.exception))
        with self.assertRaises(SystemExit):
            render(root, release(prerelease=True))
        self.assertEqual((root / "index.html").read_text(encoding="utf-8"), "UNTOUCHED")
        self.assertEqual(list(root.iterdir()), [root / "index.html"])

    def test_asset_version_must_match_tag(self):
        payload = release()
        payload["assets"][0]["name"] = "AutoClip.Desktop_1.5.7_aarch64.dmg"
        with self.assertRaises(SystemExit):
            pick_assets(payload, "1.5.8")


class SlotIsolation(unittest.TestCase):
    def test_stale_intro_updates_without_touching_history(self):
        stale = INDEX_SAMPLE.replace("当前版本 1.5.8", "当前版本 1.5.0").replace(
            "v1.5.8 for Windows", "v1.5.0 for Windows"
        )
        self.assertIn("当前版本 1.5.0", stale)
        updated = patch_index(stale, "1.5.9", {"mac": {"size_mb": 348}, "win": {"size_mb": 195}})
        self.assertIn("当前版本 1.5.9", updated)
        self.assertIn("v1.5.9 for Windows", updated)
        self.assertIn(">AutoClip 1.5.0<", updated)
        self.assertNotIn("当前版本 1.5.0", updated)
        self.assertNotIn("1.5.8", updated)

    def test_downgrade_rewrites_current_slots_only(self):
        updated = patch_index(INDEX_SAMPLE, "1.5.7", ASSETS)
        self.assertIn("/v1.5.7/AutoClip.Desktop_1.5.7_aarch64.dmg", updated)
        self.assertIn("<span class=\"ver\">v1.5.7 · 11 MB</span>", updated)
        self.assertIn("<span class=\"ver\">v1.5.7 · 22 MB</span>", updated)
        self.assertIn("'hero.note':'v1.5.7", updated)
        self.assertIn("当前版本 1.5.7", updated)
        self.assertIn(">AutoClip 1.5.0<", updated)
        self.assertNotIn("/v1.5.8/", updated)
        again = patch_index(updated, "1.5.7", ASSETS)
        self.assertEqual(again, updated)

    def test_publish_guide_keeps_feature_introduction(self):
        updated = patch_publish(PUBLISH_SAMPLE, "1.5.8")
        self.assertIn("现为 v1.5.8", updated)
        self.assertIn("current release (v1.5.8)", updated)
        self.assertIn("現在 v1.5.8", updated)
        self.assertIn("지금 v1.5.8", updated)
        self.assertIn("versión actual (v1.5.8)", updated)
        self.assertIn("versão atual (v1.5.8)", updated)
        self.assertIn("сейчас v1.5.8", updated)
        self.assertIn("version actuelle (v1.5.8)", updated)
        self.assertEqual(
            len(re.findall(r"自 v1\.3\.2", updated)),
            len(re.findall(r"自 v1\.3\.2", PUBLISH_SAMPLE)),
        )
        self.assertNotIn("现为 v1.5.0", updated)

    def test_llms_current_version_is_separate_from_the_first_run_case(self):
        brief = patch_llms(LLMS_SAMPLE, "1.5.8")
        full = patch_llms_full(
            LLMS_FULL_SAMPLE,
            "1.5.8",
            {"mac": {"size_mb": 348}, "win": {"size_mb": 195}},
            "2026-11-02T12:15:50Z",
        )
        self.assertIn("Version 1.5.8 ships", brief)
        self.assertIn("1.5.8 同时提供", brief)
        self.assertIn("official 1.5.0", brief)
        self.assertIn("## Current product (1.5.8)", full)
        self.assertIn("macOS ~348 MB, Windows ~195 MB", full)
        self.assertIn("1.5.8 提供 Windows", full)
        self.assertIn("Official AutoClip 1.5.0", full)
        self.assertIn("same 1.5 pipeline", full)
        self.assertIn("Updated: 2026-11-02", full)

    def test_game_streams_page_syncs_download_slots(self):
        updated = patch_game_streams(GAME_STREAMS_SAMPLE, "1.5.9", ASSETS)
        self.assertIn("/v1.5.9/AutoClip.Desktop_1.5.9_aarch64.dmg", updated)
        self.assertIn("/v1.5.9/AutoClip.Desktop_1.5.9_x64-setup.exe", updated)
        self.assertIn('<span class="ver">v1.5.9 · 11 MB</span>', updated)
        self.assertIn('<span class="ver">v1.5.9 · 22 MB</span>', updated)
        self.assertIn("v1.6.0 即将发布", updated)
        self.assertNotIn("/v1.5.8/", updated)

    def test_render_accepts_live_pages_regardless_of_current_version(self):
        files = render(ROOT, release("v9.9.9"))
        self.assertIn("/v9.9.9/AutoClip.Desktop_9.9.9_aarch64.dmg", files["index.html"])
        self.assertIn("/v9.9.9/AutoClip.Desktop_9.9.9_aarch64.dmg", files["features/game-streams/index.html"])
        self.assertIn("现为 v9.9.9", files["guides/publish/index.html"])
        self.assertIn("Version 9.9.9 ships", files["llms.txt"])
        self.assertIn("## Current product (9.9.9)", files["llms-full.txt"])


class FactsStayTrue(unittest.TestCase):
    def test_static_claims_match_v1_5_8_docs(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        retired = (ROOT / "项目介绍文档.md").read_text(encoding="utf-8")
        self.assertIn("macOS 15 及以上", html)
        self.assertIn("隐私与安全性 → 仍要打开", html)
        self.assertIn("System Settings → Privacy & Security → Open Anyway", html)
        self.assertIn("尚未做 Apple 公证", html)
        self.assertIn("not notarized", html)
        self.assertIn("Intel Mac 暂不支持", html)
        self.assertIn("Windows 10 / 11", html)
        self.assertIn("CLI / MCP", html)
        self.assertNotIn("7 个工具", html)
        self.assertNotIn("Seven tools", html)
        self.assertNotIn("8GB以上", retired)
        self.assertNotIn("B站自动上传", retired)
        self.assertIn("https://zhouxiaoka.github.io/autoclip_intro/", retired)
        full = (ROOT / "llms-full.txt").read_text(encoding="utf-8")
        self.assertIn("Privacy & Security → Open Anyway", full)
        self.assertNotIn("云端模型只收字幕文本", full)


if __name__ == "__main__":
    unittest.main()
