const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const dir=path.join(__dirname,'../cases');
const PLATFORMS=['douyin','xiaohongshu','bilibili','tiktok','instagram_reels','youtube_shorts','youtube_long'];
const TEMPLATES=['interview','podcast','original'],SCENES=['interview','podcast','course','gameplay','talk'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const index=read(path.join(dir,'index.json'));
test('index lists every case folder exactly once, newest first',()=>{
 const folders=fs.readdirSync(dir,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
 assert.deepEqual([...index.cases].sort(),folders);
 assert.equal(new Set(index.cases).size,index.cases.length);
 const dates=index.cases.map(id=>read(path.join(dir,id,'case.json')).added);
 assert.deepEqual(dates,[...dates].sort().reverse());
 assert.equal(index.updated,dates[0]);
});
test('every case is complete and every referenced file exists',()=>{
 for(const id of index.cases){
  const c=read(path.join(dir,id,'case.json')),where=id+': ';
  assert.equal(c.schema,1,where+'schema');assert.equal(c.id,id,where+'id');
  assert.match(id,/^[a-z0-9-]{1,48}$/,where+'id format');
  assert.match(c.added,/^\d{4}-\d{2}-\d{2}$/,where+'added');
  assert.ok(SCENES.includes(c.scene),where+'scene');
  assert.match(c.source.url,/^https:\/\//,where+'source url');
  assert.ok(c.source.title&&c.source.channel,where+'source title/channel');
  if(c.contributor){assert.ok(c.contributor.name,where+'contributor name');if(c.contributor.url)assert.match(c.contributor.url,/^https:\/\//,where+'contributor url');}
  if(c.run)for(const k of ['minutes','cost_cny','found','rendered'])assert.equal(typeof c.run[k],'number',where+'run.'+k);
  assert.ok(c.outputs.length>0,where+'outputs');
  assert.equal(new Set(c.outputs.map(o=>o.id)).size,c.outputs.length,where+'unique output ids');
  for(const o of c.outputs){
   const w=where+o.id+': ';
   assert.match(o.id,/^\d{2}$/,w+'id');
   assert.ok(PLATFORMS.includes(o.platform),w+'platform');assert.ok(TEMPLATES.includes(o.template),w+'template');
   assert.ok(o.title_lines.length&&o.title_lines.every(Boolean),w+'title');
   assert.ok(o.duration_sec>0,w+'duration');
   for(const f of ['video','loop','poster','cover'])if(o[f]||f!=='cover')assert.ok(fs.existsSync(path.join(dir,id,o[f])),w+f);
   if(o.post){assert.ok(o.post.title&&o.post.title.length<=100,w+'post title');assert.ok((o.post.description||'').length<=2000,w+'post description');assert.ok(Array.isArray(o.post.tags)&&o.post.tags.length<=12,w+'post tags');}
  }
 }
});
