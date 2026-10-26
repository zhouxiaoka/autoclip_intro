/* Homepage Agent module behind the site_agents_module flag (build default on).
   Without consent the default applies and no flag request is made. */
(() => {
  'use strict';
  const section = document.querySelector('[data-flag="site_agents_module"]');
  const api = window.AutoClipAnalytics;
  if (!section) return;
  let shown = api ? api.flagDefault('site_agents_module') : true;
  section.hidden = !shown;
  api?.flag('site_agents_module', value => { shown = value; section.hidden = !value; });
  document.addEventListener('click', event => {
    const a = event.target.closest?.('a[data-agents-module]');
    if (a && shown) api?.capture('home_agents_module_click', {variant: 'on'});
  }, true);
})();
