const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/language-routing.js'),'utf8');
function boot(href){
 const actions=[],callbacks={},context={URL,window:{},localStorage:{setItem(){}},location:new URL(href)};
 context.location.replace=url=>actions.push(['replace',url]);context.location.assign=url=>actions.push(['assign',url]);
 const selector={addEventListener:(name,fn)=>callbacks.change=fn};
 context.document={currentScript:{src:'https://example.test/autoclip_intro/assets/language-routing.js'},documentElement:{dataset:{staticLanguage:href.includes('/en/')?'en':'zh'}},addEventListener:(name,fn)=>callbacks[name]=fn,getElementById:()=>selector};
 vm.runInNewContext(source,context);return {actions,callbacks,context};
}
test('explicit language query routes to static English while preserving campaign and fragment',()=>{
 const p=boot('https://example.test/autoclip_intro/use-cases/podcast/?lang=en&utm_source=x#download');
 const url=new URL(p.actions[0][1]);assert.equal(p.actions[0][0],'replace');assert.equal(url.pathname,'/autoclip_intro/en/use-cases/podcast/');assert.equal(url.searchParams.get('utm_source'),'x');assert.equal(url.searchParams.has('lang'),false);assert.equal(url.hash,'#download');
});
test('static paths stay stable without language requests and do not redirect unknown pages',()=>{
 for(const path of ['','en/','private/?lang=en'])assert.equal(boot('https://example.test/autoclip_intro/'+path).actions.length,0);
});
test('switching to Chinese returns to paired path without removing attribution',()=>{
 const p=boot('https://example.test/autoclip_intro/en/?utm_campaign=launch#download');p.callbacks.DOMContentLoaded();
 let stopped=false;p.callbacks.change({target:{value:'zh'},stopImmediatePropagation(){stopped=true}});
 const u=new URL(p.actions[0][1]);assert.equal(u.pathname,'/autoclip_intro/');assert.equal(u.searchParams.get('utm_campaign'),'launch');assert.equal(u.hash,'#download');assert.equal(stopped,true);
});

test('unpaired pages stay off the English tree and keep a language query',()=>{
 const p=boot('https://example.test/autoclip_intro/en/');
 const loc=p.context.window.AutoClipLocale.localized;
 const fromEn=loc(new URL('https://example.test/autoclip_intro/en/guides/publish/'),'en');
 assert.equal(fromEn.pathname,'/autoclip_intro/guides/publish/');
 assert.equal(fromEn.searchParams.get('lang'),'en');
 const fromRoot=loc(new URL('https://example.test/autoclip_intro/guides/publish/'),'en');
 assert.equal(fromRoot.pathname,'/autoclip_intro/guides/publish/');
 assert.equal(fromRoot.searchParams.get('lang'),'en');
 const zh=loc(new URL('https://example.test/autoclip_intro/guides/publish/?lang=en'),'zh');
 assert.equal(zh.pathname,'/autoclip_intro/guides/publish/');
 assert.equal(zh.searchParams.has('lang'),false);
});
test('a language query on a missing English publish guide redirects to the existing page',()=>{
 const p=boot('https://example.test/autoclip_intro/en/guides/publish/?lang=en');
 const url=new URL(p.actions[0][1]);
 assert.equal(p.actions[0][0],'replace');
 assert.equal(url.pathname,'/autoclip_intro/guides/publish/');
 assert.equal(url.searchParams.get('lang'),'en');
});

test('homepage catalog publish hrefs resolve to the existing guide from / and /en/',()=>{
 const site=path.join(__dirname,'..');
 const home=fs.readFileSync(path.join(site,'index.html'),'utf8');
 const zh=home.match(/'faq\.7\.a':'在设置[\s\S]*?href="([^"]+)"/)[1];
 const en=home.match(/'faq\.7\.a':'Add an Upload-Post[\s\S]*?href="([^"]+)"/)[1];
 const loc=boot('https://example.test/autoclip_intro/en/').context.window.AutoClipLocale.localized;
 const source=new URL('https://example.test/autoclip_intro/');
 assert.ok(fs.existsSync(path.join(site,'guides/publish/index.html')));
 assert.ok(!fs.existsSync(path.join(site,'en/guides/publish/index.html')));
 for(const [language,href] of [['zh',zh],['en',en]]){
  const resolved=loc(new URL(href,source),language);
  assert.equal(resolved.pathname,'/autoclip_intro/guides/publish/',language+': '+href);
  if(language==='en')assert.equal(resolved.searchParams.get('lang'),'en');
  else assert.equal(resolved.searchParams.has('lang'),false);
 }
 const mistaken=loc(new URL('guides/publish/',new URL('https://example.test/autoclip_intro/en/')),'en');
 assert.equal(mistaken.pathname,'/autoclip_intro/guides/publish/');
 assert.equal(mistaken.searchParams.get('lang'),'en');
});
