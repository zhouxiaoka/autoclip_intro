"""已提交的发布槽位必须与 data/release.json 一致，且不把历史版本改成当前版。"""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CommittedRelease(unittest.TestCase):
    def test_slots_match_the_stable_release_document(self):
        document = json.loads((ROOT / "data/release.json").read_text(encoding="utf-8"))
        self.assertFalse(document["draft"])
        self.assertFalse(document["prerelease"])
        version = document["version"]
        self.assertEqual(document["tag"], f"v{version}")
        mac = document["assets"]["mac"]
        win = document["assets"]["win"]
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        english = (ROOT / "en/index.html").read_text(encoding="utf-8")
        publish = (ROOT / "guides/publish/index.html").read_text(encoding="utf-8")
        brief = (ROOT / "llms.txt").read_text(encoding="utf-8")
        full = (ROOT / "llms-full.txt").read_text(encoding="utf-8")
        for page in (index, english):
            self.assertIn(f'"softwareVersion": "{version}"', page)
            self.assertIn(f"当前版本 {version}", page)
            self.assertIn(f"v{version} for Windows", page)
            self.assertIn(f"/v{version}/{mac['name']}", page)
            self.assertIn(f"/v{version}/{win['name']}", page)
            self.assertIn(f"v{version} · {mac['size_mb']} MB", page)
            self.assertIn(f"v{version} · {win['size_mb']} MB", page)
            self.assertIn(f"'hero.note':'v{version}", page)
        for needle in (
            f"现为 v{version}",
            f"current release (v{version})",
            f"現在 v{version}",
            f"지금 v{version}",
            f"versión actual (v{version})",
            f"versão atual (v{version})",
            f"сейчас v{version}",
            f"version actuelle (v{version})",
        ):
            self.assertIn(needle, publish)
        self.assertIn("自 v1.3.2", publish)
        self.assertIn(f"Version {version} ships", brief)
        self.assertIn("official 1.5.0", brief)
        self.assertIn(f"## Current product ({version})", full)
        self.assertIn(f"macOS ~{mac['size_mb']} MB, Windows ~{win['size_mb']} MB", full)
        self.assertIn("Official AutoClip 1.5.0", full)
        self.assertIn(">AutoClip 1.5.0<", index)


if __name__ == "__main__":
    unittest.main()
