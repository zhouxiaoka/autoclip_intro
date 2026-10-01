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

/* hero: paste → pick → one click → done */
let running=false,visible=true;
async function demo(){
 const box=document.querySelector('[data-demo]');if(!box||running)return;running=true;
 const art=box.closest('.hero-art'),typed=box.querySelector('[data-typed]'),pills=[...box.querySelectorAll('[data-pill]')],steps=[...box.querySelectorAll('[data-step]')],clockEl=box.querySelector('[data-clock]');
 const final=()=>{typed.textContent=typed.dataset.typed;pills.forEach(p=>p.classList.add('on'));steps.forEach(s=>s.classList.add('done'));clockEl.textContent='7:30';art.classList.add('go','done');};
 if(reduce.matches){final();running=false;return;}
 while(true){
  while(!visible||document.hidden)await wait(400);
  art.classList.remove('go','done');pills.forEach(p=>p.classList.remove('on'));steps.forEach(s=>s.classList.remove('done','now'));typed.textContent='';clockEl.textContent='0:00';
  await wait(700);
  for(const ch of typed.dataset.typed){typed.textContent+=ch;await wait(28);}
  await wait(350);
  for(const p of pills){p.classList.add('on');await wait(260);}
  await wait(450);art.classList.add('go');await wait(500);
  const total=450,t0=performance.now();
  const tick=()=>{const p=Math.min(1,(performance.now()-t0)/2600);clockEl.textContent=clock(total*p);if(p<1&&art.classList.contains('go'))requestAnimationFrame(tick);};requestAnimationFrame(tick);
  for(const s of steps){s.classList.add('now');await wait(480);s.classList.remove('now');s.classList.add('done');}
  await wait(250);art.classList.add('done');
  await wait(5200);
  if(reduce.matches){final();break;}
 }
 running=false;
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
library();demo();chat();story();
new MutationObserver(()=>{library();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
