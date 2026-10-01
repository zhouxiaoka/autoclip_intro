(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const CHAT={
 zh:[['me','帮我把这期访谈剪几个高光'],['ai','好的！请问目标平台是哪个？'],['me','抖音，竖屏'],['ai','明白。希望每段多长？需要字幕吗？'],['me','一两分钟，要字幕'],['ai','字幕要什么样式？中英双语还是只要中文？'],['me','双语……'],['ai','好的。请问片段要从哪里开始？可以给我时间戳吗？'],['me','……'],['ai','抱歉，第 3 段把下一个问题也剪进去了，需要我重新处理吗？']],
 en:[['me','Cut a few highlights from this interview'],['ai','Sure! Which platform is this for?'],['me','TikTok, vertical'],['ai','Got it. How long should each clip be? Captions?'],['me','A minute or two, with captions'],['ai','Which caption style would you like?'],['me','Something clean…'],['ai','Okay. Can you give me timestamps to start from?'],['me','…'],['ai','Sorry, clip 3 includes the next question. Want me to redo it?']]};
let lang='en';
const L=()=>(document.documentElement.lang||'en').split('-')[0]==='zh'?'zh':'en';
const clock=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=String(s%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${x}`:`${m}:${x}`;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* posters and real copy from the case library */
async function library(){
 const api=window.ACLibrary;if(!api)return;await api.load().catch(()=>null);
 document.querySelectorAll('[data-poster]').forEach(img=>{const o=api.find(img.dataset.poster);if(o){img.src=api.media(o,'poster');img.loading='lazy';}});
 document.querySelectorAll('[data-poster-bg]').forEach(el=>{const o=api.find(el.dataset.posterBg);if(o)el.style.backgroundImage=`url("${api.media(o,'poster')}")`;});
 document.querySelectorAll('[data-kit-title]').forEach(el=>{const o=api.find(el.dataset.kitTitle);if(o)el.textContent=o.title_lines.join(' ');});
 document.querySelectorAll('[data-cands]').forEach(ol=>{const lib=api.find(ol.dataset.cands+'/01')?.case;if(!lib)return;
  const rows=lib.outputs.slice(0,6);ol.innerHTML=rows.map((o,i)=>`<li class="${i<4?'pick':''}"><span class="d"></span><span class="tc mono">${clock(o.source_start_sec||0)}</span><span class="tt">${o.title_lines.join(' ')}</span><span class="du mono">${clock(o.duration_sec)}</span></li>`).join('')+`<li class="more mono">+ ${Math.max(0,(lib.run?.found||rows.length)-rows.length)}</li>`;});
}

/* hero: paste → pick → one click → done.
   Wide screens: scroll scrubs the run (reversible); narrow screens loop on a timer. */
let running=false,visible=true;
const clamp=v=>Math.max(0,Math.min(1,v));
function parts(){const box=document.querySelector('[data-demo]');if(!box)return null;return {box,art:box.closest('.hero-art'),typed:box.querySelector('[data-typed]'),pills:[...box.querySelectorAll('[data-pill]')],steps:[...box.querySelectorAll('[data-step]')],clockEl:box.querySelector('[data-clock]')};}
function finalState(d){d.typed.textContent=d.typed.dataset.typed;d.pills.forEach(p=>p.classList.add('on'));d.steps.forEach(s=>{s.classList.add('done');s.classList.remove('now');});d.clockEl.textContent='7:30';d.art.classList.add('go','done');}
async function intro(d){d.typed.textContent='';await wait(500);for(const ch of d.typed.dataset.typed){if(d.typed.dataset.skip||d.frozen)break;d.typed.textContent+=ch;await wait(26);}d.typed.textContent=d.typed.dataset.typed;for(const p of d.pills){await wait(220);p.classList.add('on');}}
let demoParts=null;
function freeze(){const d=demoParts;if(!d||d.frozen)return;d.frozen=true;finalState(d);}
async function demo(){
 const d=parts();if(!d||running)return;running=true;demoParts=d;
 if(reduce.matches){finalState(d);return;}
 while(true){
  while(!visible||document.hidden)await wait(400);
  if(d.frozen)return;
  d.art.classList.remove('go','done');d.pills.forEach(p=>p.classList.remove('on'));d.steps.forEach(s=>s.classList.remove('done','now'));d.clockEl.textContent='0:00';
  await intro(d);await wait(450);d.art.classList.add('go');await wait(500);
  const t0=performance.now();const tick=()=>{const p=Math.min(1,(performance.now()-t0)/2600);d.clockEl.textContent=clock(450*p);if(p<1&&d.art.classList.contains('go'))requestAnimationFrame(tick);};requestAnimationFrame(tick);
  for(const s of d.steps){if(d.frozen)return;s.classList.add('now');await wait(480);s.classList.remove('now');s.classList.add('done');}
  await wait(250);if(d.frozen)return;d.art.classList.add('done');await wait(5200);if(d.frozen)return;
  if(reduce.matches){finalState(d);break;}
 }
}

/* the reel: clips from the demo's link fan out of the hero collage as you scroll */
async function reel(){
 const host=document.querySelector('[data-reel]'),row=host?.querySelector('[data-reel-row]'),api=window.ACLibrary;if(!row||!api)return;
 await api.load().catch(()=>null);const c=api.find(host.dataset.reel+'/01')?.case;if(!c)return;
 const zh=L()==='zh',r=c.run,shown=c.outputs.slice(0,6),rest=Math.max(0,(r?.rendered||c.outputs.length)-shown.length);
 const hrs=`${Math.floor(c.source.duration_sec/3600)}h${String(Math.round(c.source.duration_sec%3600/60)).padStart(2,'0')}m`;
 host.querySelector('[data-reel-stats]').textContent=r?(zh?`${c.source.channel} · ${hrs} 访谈 → ${r.rendered} 条${api.platform(shown[0].platform)}成片 · ${r.minutes} 分钟 · 模型费用 ¥${r.cost_cny.toFixed(2)}`:`${c.source.channel} · ${hrs} interview → ${r.rendered} ${api.platform(shown[0].platform)} clips · ${r.minutes} min · ¥${r.cost_cny.toFixed(2)} in model fees`):'';
 row.innerHTML=shown.map(o=>api.card(o)).join('')+(rest?`<a class="clip reel-more" href="#clips"><span class="clip-media"><b>+${rest}</b><span>${zh?'更多成片在案例库':'More in the case library'}</span></span></a>`:'');
 api.wire(row);
 const cards=[...row.children];if(reduce.matches||!matchMedia('(min-width: 961px)').matches){host.classList.add('landed');return;}
 const srcs=[...document.querySelectorAll('.demo-out img')],label=host.querySelector('.reel-label'),art=document.querySelector('.hero-art');
 const fly=document.createElement('div');fly.className='reel-fly';fly.setAttribute('aria-hidden','true');
 const ghosts=cards.map((el,i)=>{const g=document.createElement('div');g.className='ghost';const img=el.querySelector('img');g.innerHTML=img?`<img src="${img.src}" alt="">`:el.querySelector('.clip-media').innerHTML;if(!img)g.classList.add('more');g.style.zIndex=String(img?20-i:10-i);fly.append(g);return g;});
 document.body.append(fly);
 const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,lerp=(a,b,t)=>a+(b-a)*t;
 const rotOf=el=>{const m=getComputedStyle(el).transform;if(!m||m==='none')return 0;const [a,b]=m.slice(7,-1).split(',').map(Number);return Math.atan2(b,a)*180/Math.PI;};
 const doc=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2+scrollX,y:r.top+r.height/2+scrollY,w:r.width,h:r.height};};
 let end=1,frame=0,state='',spots=null,lastY=-1;
 const measure=()=>{
  const rowR=row.getBoundingClientRect();end=Math.max(240,rowR.top+scrollY-innerHeight*.42);
  const mid=srcs[1]||srcs[0];
  spots=ghosts.map((g,i)=>{
   const src=srcs[i]||mid,media=cards[i].querySelector('.clip-media');if(!src||!media)return null;
   const S=doc(src),T=doc(media);
   g.style.width=T.w+'px';g.style.height=T.h+'px';
   return {sx:S.x,sy:S.y,sw:S.w,sh:S.h,rot:srcs[i]?rotOf(src):0,tx:T.x,ty:T.y,tw:T.w,th:T.h,own:!!srcs[i]};
  });
  lastY=-1;update();
 };
 const set=(next)=>{if(next===state)return;state=next;fly.classList.toggle('on',next==='fly');host.classList.toggle('landed',next==='landed');art?.classList.toggle('sent',next!=='home');};
 const update=()=>{
  frame=0;const y=scrollY;if(y===lastY&&spots)return;lastY=y;
  const q=Math.max(0,Math.min(1,y/end));
  if(q>0&&!demoParts?.frozen){freeze();requestAnimationFrame(measure);return;}
  label.style.opacity=String(Math.max(0,Math.min(1,(q-.72)/.25)));
  if(q<=0){set('home');return;}if(q>=1){set('landed');return;}
  if(!spots){measure();return;}
  set('fly');
  const sx=scrollX,sy=scrollY;
  ghosts.forEach((g,i)=>{const p=spots[i];if(!p)return;
   const k=ease(Math.max(0,Math.min(1,q*1.1-(i>2?(i-2)*.02:0))));
   const cx=lerp(p.sx,p.tx,k)-sx,cy=lerp(p.sy,p.ty,k)-sy;
   const sw=lerp(p.sw,p.tw,k)/p.tw,sh=lerp(p.sh,p.th,k)/p.th,r=lerp(p.rot,0,k);
   g.style.transform=`translate3d(${cx-p.tw/2}px,${cy-p.th/2}px,0) rotate(${r}deg) scale(${sw},${sh})`;
   g.style.opacity=p.own?'1':String(Math.min(1,k*2.2));
  });
 };
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
 addEventListener('resize',()=>{spots=null;requestAnimationFrame(measure);},{passive:true});
 requestAnimationFrame(measure);
}

/* endless clarifying questions */
async function chat(){
 const box=document.querySelector('[data-chat]');if(!box)return;
 const draw=n=>{const msgs=CHAT[L()];box.innerHTML=msgs.slice(0,n).map(([w,t])=>`<p class="${w}">${t}</p>`).join('');box.scrollTop=box.scrollHeight;};
 if(reduce.matches){draw(CHAT.en.length);return;}
 let n=1;while(true){while(document.hidden)await wait(400);draw(n);box.classList.toggle('typing',n<CHAT.en.length);await wait(n%2?1300:900);n=n>=CHAT.en.length?1:n+1;}
}

/* sticky step list follows the panels */
function story(){
 const navs=[...document.querySelectorAll('[data-story-nav]')],panels=[...document.querySelectorAll('[data-story]')];if(!panels.length)return;
 const set=i=>{navs.forEach(n=>n.classList.toggle('on',n.dataset.storyNav===String(i)));panels.forEach(p=>p.classList.toggle('on',p.dataset.story===String(i)));};
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)set(e.target.dataset.story);}),{rootMargin:'-45% 0px -45% 0px'});
 panels.forEach(p=>io.observe(p));set(0);
 navs.forEach(n=>n.addEventListener('click',()=>panels[+n.dataset.storyNav].scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'center'})));
}

const heroEl=document.querySelector('.hero-art');
if(heroEl)new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(heroEl);
library();demo();chat();story();reel();
new MutationObserver(()=>{library();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
