import re
import tempfile
import unittest
import urllib.error
from pathlib import Path

from sync_release import (
    fetch_release,
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


def release(tag="v1.5.8", **extra):
    payload = {
        "tag_name": tag,
        "draft": False,
        "prerelease": False,
        "published_at": "2026-11-02T12:15:50Z",
        "html_url": f"https://github.com/zhouxiaoka/autoclip/releases/tag/{tag}",
        "assets": [
            {"name": "AutoClip.Desktop_1.5.8_aarch64.dmg", "size": 348 * 1024 * 1024, "browser_download_url": "https://example.test/mac"},
            {"name": "AutoClip.Desktop_1.5.8_x64-setup.exe", "size": 195 * 1024 * 1024, "browser_download_url": "https://example.test/win"},
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
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        stale = html.replace("当前版本 1.5.8", "当前版本 1.5.0").replace(
            "v1.5.8 for Windows", "v1.5.0 for Windows"
        )
        self.assertIn("当前版本 1.5.0", stale)
        updated = patch_index(stale, "1.5.8", {"mac": {"size_mb": 348}, "win": {"size_mb": 195}})
        self.assertIn("当前版本 1.5.8", updated)
        self.assertIn("v1.5.8 for Windows", updated)
        self.assertIn(">AutoClip 1.5.0<", updated)
        self.assertNotIn("当前版本 1.5.0", updated)

    def test_downgrade_rewrites_current_slots_only(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        updated = patch_index(html, "1.5.7", ASSETS)
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
        html = (ROOT / "guides/publish/index.html").read_text(encoding="utf-8")
        updated = patch_publish(html, "1.5.8")
        self.assertIn("现为 v1.5.8", updated)
        self.assertIn("current release (v1.5.8)", updated)
        self.assertIn("現在 v1.5.8", updated)
        self.assertIn("지금 v1.5.8", updated)
        self.assertIn("versión actual (v1.5.8)", updated)
        self.assertIn("versão atual (v1.5.8)", updated)
        self.assertIn("сейчас v1.5.8", updated)
        self.assertIn("version actuelle (v1.5.8)", updated)
        self.assertEqual(len(re.findall(r"自 v1\.3\.2", updated)), len(re.findall(r"自 v1\.3\.2", html)))
        self.assertNotIn("现为 v1.5.0", updated)

    def test_llms_current_version_is_separate_from_the_first_run_case(self):
        brief = (ROOT / "llms.txt").read_text(encoding="utf-8")
        full = (ROOT / "llms-full.txt").read_text(encoding="utf-8")
        brief = patch_llms(brief, "1.5.8")
        full = patch_llms_full(full, "1.5.8", {"mac": {"size_mb": 348}, "win": {"size_mb": 195}}, "2026-11-02T12:15:50Z")
        self.assertIn("Version 1.5.8 ships", brief)
        self.assertIn("1.5.8 同时提供", brief)
        self.assertIn("official 1.5.0", brief)
        self.assertIn("## Current product (1.5.8)", full)
        self.assertIn("macOS ~348 MB, Windows ~195 MB", full)
        self.assertIn("1.5.8 提供 Windows", full)
        self.assertIn("Official AutoClip 1.5.0", full)
        self.assertIn("same 1.5 pipeline", full)
        self.assertIn("Updated: 2026-11-02", full)


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
        gameplay = (ROOT / "use-cases/gameplay/index.html").read_text(encoding="utf-8")
        self.assertNotIn("使用场景 · 1.5.0", gameplay)
        self.assertNotIn("Use case · 1.5.0", gameplay)
        self.assertIn("该样本没有在当前正式版上重新验收", gameplay)
        self.assertIn("has not been re-checked on the current stable release", gameplay)
        self.assertNotIn("content.js", gameplay)
        self.assertIn("1.4 基础能力", (ROOT / "use-cases/gameplay/content.js").read_text(encoding="utf-8"))
        full = (ROOT / "llms-full.txt").read_text(encoding="utf-8")
        self.assertIn("Privacy & Security → Open Anyway", full)
        self.assertNotIn("云端模型只收字幕文本", full)


if __name__ == "__main__":
    unittest.main()
