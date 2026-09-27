const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.join(__dirname,'../use-cases/gameplay');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const catalog=fs.readFileSync(path.join(root,'content.js'),'utf8');
const script=fs.readFileSync(path.join(root,'page.js'),'utf8');
const copy=JSON.parse(catalog.slice('const GAME_COPY = '.length).trim().slice(0,-1));
test('game use case has complete translated content and local assets',()=>{
 const keys=[...html.matchAll(/data-copy="([^"]+)"/g)].map(m=>m[1]);
 for(const lang of Object.keys(copy)) for(const key of keys) assert.ok(copy[lang][key],`${lang}.${key}`);
 assert.equal(Object.keys(copy).length,8);
 for(const [,target] of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
  if(/^(https?:|#)/.test(target))continue;
  assert.ok(fs.existsSync(path.resolve(root,target)),target);
 }
});
test('language switches update metadata and downloads without losing the anchor',()=>{
 const nodes={};const node=k=>nodes[k]??={content:'',value:'',textContent:'',addEventListener(t,fn){this[t]=fn}};
 const elements=[...html.matchAll(/data-copy="([^"]+)"/g)].map(m=>({dataset:{copy:m[1]},textContent:''}));
 const link={href:'../../#download',getAttribute(){return this.href}};
 const storage=new Map();const doc={documentElement:{},querySelector:node,getElementById:node,querySelectorAll:q=>q==='[data-copy]'?elements:q==='[data-home-link]'?[link]:[]};
 const context={document:doc,navigator:{languages:['en']},location:{search:'?lang=ja',href:'http://localhost/autoclip_intro/use-cases/gameplay/'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},URL,URLSearchParams,history:{replaceState(){}}};
 vm.runInNewContext(catalog+'\n'+script,context);
 assert.equal(doc.documentElement.lang,'ja');
 for(const lang of Object.keys(copy)) {
  nodes.language.change({target:{value:lang}});
  assert.equal(doc.title,copy[lang].label+' | AutoClip');
  assert.equal(node('meta[name="description"]').content,copy[lang].intro);
  assert.equal(new URL(link.href).hash,'#download');
  assert.equal(new URL(link.href).searchParams.get('lang'),lang);
  for(const el of elements) assert.equal(el.textContent,copy[lang][el.dataset.copy]);
 }
});
