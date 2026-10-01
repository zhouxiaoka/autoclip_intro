(()=>{'use strict';
const COPY=window.INNER_COPY||{zh:{},en:{}};
const ATTR={zh:'zh-CN',en:'en',ja:'ja',ko:'ko',es:'es',pt:'pt-BR',ru:'ru',fr:'fr'};
function apply(lang){
 if(!ATTR[lang])lang='en';
 const d=COPY[lang]||COPY.en;
 document.documentElement.lang=ATTR[lang];
 if(d.title)document.title=d.title;
 document.querySelectorAll('[data-copy]').forEach(el=>{const k=el.getAttribute('data-copy');if(d[k]!=null)el.textContent=d[k];});
 document.querySelectorAll('[data-home]').forEach(a=>{const u=new URL(a.getAttribute('href'),location.href);u.searchParams.set('lang',lang);a.href=u.href;});
 const sel=document.getElementById('language');if(sel)sel.value=lang;
 try{localStorage.setItem('autoclip.lang',lang);}catch(e){}
}
let saved=null;try{saved=localStorage.getItem('autoclip.lang');}catch(e){}
const q=new URLSearchParams(location.search).get('lang');
const nav=(navigator.languages||[navigator.language||'en']).map(l=>l.toLowerCase().split('-')[0]).filter(l=>ATTR[l])[0];
apply(ATTR[q]?q:ATTR[saved]?saved:nav||'en');
document.getElementById('language')?.addEventListener('change',e=>{
 apply(e.target.value);
 const u=new URL(location.href);u.searchParams.set('lang',e.target.value);history.replaceState(null,'',u);
});
})();
