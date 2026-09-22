const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8')
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
const c = {}
vm.runInNewContext(script.slice(script.indexOf('  var T ='), script.indexOf('  var isWin')), c)
const langs=['zh','en','ja','ko','es','pt','ru','fr']
function launch({saved=null,languages=['en-US'],search='',windows=false}={}) {
 const nodes={}; const storage=new Map(saved?[['autoclip.lang',saved]]:[])
 const node=id=>nodes[id] ||= {textContent:'',innerHTML:'',href:'',content:'',value:'',setAttribute(k,v){this[k]=v},addEventListener(type,fn){this[type]=fn}}
 const textKeys=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>m[1])
 const htmlKeys=[...html.matchAll(/data-i18n-html="([^"]+)"/g)].map(m=>m[1])
 const make=(k,attr)=>({...node(k),getAttribute:()=>k})
 const textNodes=textKeys.map(k=>make(k)),htmlNodes=htmlKeys.map(k=>make(k))
 const document={documentElement:{lang:''},title:'',getElementById:node,querySelector:node,querySelectorAll:q=>q==='[data-i18n]'?textNodes:htmlNodes}
 const context={document,navigator:{languages,language:languages[0],userAgent:windows?'Windows':'Mac'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},URLSearchParams,URL,location:{search,href:'https://example.test/'+search+'#download'},history:{replaceState(a,b,url){this.url=url}}}
 vm.runInNewContext(script,context)
 return {...context,nodes,storage,textNodes,htmlNodes}
}
test('eight catalogs cover all translated elements and preserve links',()=>{
 const keys=Object.keys(c.T.en).sort()
 for(const lang of langs){
  assert.deepEqual(Object.keys(c.T[lang]).sort(),keys,lang)
  for(const [,key] of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g))assert.ok(c.T[lang][key],lang+': '+key)
  for(const key of ['dl.alt','fb.alt','fb.stuck','faq.5.a']){
   const links=s=>[...s.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('#')).sort()
   assert.deepEqual(links(c.T[lang][key]),links(c.T.en[key]),lang+': '+key)
  }
 }
})
test('URL, saved selection, regional browser preferences and fallback have the right precedence',()=>{
 assert.equal(launch({search:'?lang=es',saved:'ja'}).document.documentElement.lang,'es')
 assert.equal(launch({saved:'ru',languages:['fr-FR']}).document.documentElement.lang,'ru')
 assert.equal(launch({languages:['ar','pt-PT']}).document.documentElement.lang,'pt-BR')
 assert.equal(launch({languages:['es-419']}).document.documentElement.lang,'es')
 assert.equal(launch({saved:'__proto__',search:'?lang=constructor',languages:['de']}).document.documentElement.lang,'en')
})
test('switches translate the whole page, update metadata, persist and retain download targets',()=>{
 const page=launch({windows:true})
 for(const lang of langs){
  page.nodes.language.change({target:{value:lang}})
  assert.equal(page.document.title,c.T[lang].title)
  assert.equal(page.nodes['meta[name="description"]'].content,c.T[lang]['hero.lede'])
  assert.equal(page.nodes['meta[name="twitter:title"]'].content,c.T[lang].title)
  assert.equal(page.nodes['meta[name="twitter:description"]'].content,c.T[lang]['hero.lede'])
  assert.equal(page.storage.get('autoclip.lang'),lang)
  assert.equal(page.history.url.searchParams.get('lang'),lang)
  assert.equal(page.history.url.hash,'#download')
  assert.ok(page.nodes['cta-primary'].href.endsWith('_x64-setup.exe'))
  assert.ok(page.nodes['cta-alt'].href.endsWith('_aarch64.dmg'))
  for(const n of page.textNodes)assert.equal(n.textContent,c.T[lang][n.getAttribute()])
 }
})
