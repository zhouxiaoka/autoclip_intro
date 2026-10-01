import re
import unittest
from pathlib import Path
from sync_release import rewrite, current_version


def release_free(html):
    html = re.sub(r'releases/download/v[\d.]+/', 'REL/', html)
    html = re.sub(r'AutoClip\.Desktop_[\d.]+_', 'PKG_', html)
    html = re.sub(r'<span class="ver">v[\d.]+ · \d+ MB</span>', 'VER', html)
    return re.sub(r"'hero\.note':'v[\d.]+|data-i18n=\"hero\.note\">v[\d.]+", 'NOTE', html)


class ReleaseScope(unittest.TestCase):
    def test_stable_links_change_but_nothing_else_does(self):
        source = (Path(__file__).resolve().parents[1] / 'index.html').read_text()
        old = current_version(source)
        assets = {'mac': {'size_mb': 240}, 'win': {'size_mb': 180}}
        updated = rewrite(source, old, '1.4.0', assets)
        self.assertIn('/v1.4.0/AutoClip.Desktop_1.4.0_aarch64.dmg', updated)
        self.assertIn('<span class="ver">v1.4.0 · 240 MB</span>', updated)
        self.assertIn("'hero.note':'v1.4.0", updated)
        future = rewrite(updated, '1.4.0', '1.4.1', assets)
        self.assertIn('/v1.4.1/', future)
        self.assertIn("'hero.note':'v1.4.1", future)
        self.assertEqual(release_free(future), release_free(source))
        self.assertEqual(rewrite(future, '1.4.1', '1.4.1', assets), future)

if __name__ == '__main__': unittest.main()
