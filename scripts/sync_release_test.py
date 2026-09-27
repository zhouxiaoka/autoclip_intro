import unittest
from pathlib import Path
from sync_release import rewrite, current_version

class ReleaseScope(unittest.TestCase):
    def test_stable_links_change_but_feature_history_does_not(self):
        source = (Path(__file__).resolve().parents[1] / 'index.html').read_text()
        old = current_version(source)
        assets = {'mac': {'size_mb': 240}, 'win': {'size_mb': 180}}
        updated = rewrite(source, old, '1.4.0', assets)
        self.assertIn('/v1.4.0/AutoClip.Desktop_1.4.0_aarch64.dmg', updated)
        self.assertIn('<span class="ver">v1.4.0 · 240 MB</span>', updated)
        self.assertIn("'hero.note':'v1.4.0", updated)
        self.assertIn('v1.3.5 里的发布与封面', updated)
        future = rewrite(updated, '1.4.0', '1.4.1', assets)
        self.assertIn('1.4.0 功能预告', future)
        self.assertIn('/v1.4.1/', future)
        self.assertEqual(rewrite(future, '1.4.1', '1.4.1', assets), future)

if __name__ == '__main__': unittest.main()
