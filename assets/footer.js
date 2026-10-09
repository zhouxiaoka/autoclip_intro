/* Footer copy for every page. Links live in each page's HTML (crawlable); labels come from here. */
(()=>{'use strict';
const C={
 zh:{tag:'一个链接，一键出片。开源、免费、在你的电脑上运行。',
  'h.product':'产品','h.uses':'使用场景','h.res':'资源','h.dev':'开发者','h.comm':'社区',
  oneclick:'一键出片',cases:'案例库',numbers:'速度与成本',download:'下载',releases:'版本发布',changelog:'更新日志',
  podcast:'访谈播客',course:'课程讲解',game:'游戏高光',publish:'发布到各平台',cover:'自动封面',
  first:'首次出片教程',shortsGuide:'播客剪成 Shorts',choice:'本地与云端怎么选',research:'研究',install:'安装与首次出片',guide:'发布教程',models:'模型配置',faq:'常见问题',llms:'给 AI 的说明',privacy:'隐私政策',
  github:'GitHub',cli:'CLI / MCP',docker:'Docker 部署',skill:'Agent skill',contrib:'贡献指南',license:'MIT 许可',
  discuss:'讨论区',submit:'投稿成片',issue:'反馈问题',known:'已知问题',contact:'联系合作',copy:'© 2025–2026 AutoClip · MIT 许可'},
 en:{tag:'One link, one click. Open source, free, and it runs on your computer.',
  'h.product':'Product','h.uses':'Use cases','h.res':'Resources','h.dev':'Developers','h.comm':'Community',
  oneclick:'One-click clips',cases:'Case library',numbers:'Speed & cost',download:'Download',releases:'Releases',changelog:'Changelog',
  podcast:'Interviews & podcasts',course:'Courses',game:'Gaming highlights',publish:'Publish everywhere',cover:'Auto cover',
  first:'First clips',shortsGuide:'Podcast to Shorts',choice:'Local vs cloud',research:'Research',install:'Install & first clip',guide:'Publish guide',models:'Model setup',faq:'FAQ',llms:'For AI systems',privacy:'Privacy',
  github:'GitHub',cli:'CLI / MCP',docker:'Docker',skill:'Agent skill',contrib:'Contributing',license:'MIT License',
  discuss:'Discussions',submit:'Share your clips',issue:'Report a bug',known:'Known issues',contact:'Contact',copy:'© 2025–2026 AutoClip · MIT License'}};
function apply(){
 const lang=(document.documentElement.lang||'en').split('-')[0],d=C[lang]||C.en;
 document.querySelectorAll('.site-footer [data-f]').forEach(el=>{const v=d[el.dataset.f];if(v!=null)el.textContent=v;});
 document.querySelectorAll('.site-footer a[href]').forEach(a=>{const u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin||u.hash&&u.pathname===location.pathname)return;u.searchParams.set('lang',lang);a.href=window.AutoClipLocale?window.AutoClipLocale.localized(u,lang).href:u.href;});
}
apply();new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
