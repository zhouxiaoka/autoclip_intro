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
