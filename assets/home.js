(()=>{'use strict';
const root=new URL('../',document.currentScript.src),asset=n=>new URL('assets/v2/'+n,root).href;
const SRC={
 dario:{name:'Dwarkesh Patel · Dario Amodei',url:'https://www.youtube.com/watch?v=n1E9IZfvGMA',title:'Dario Amodei — “We are near the end of the exponential”'},
 sam:{name:'Y Combinator · Sam Altman',url:'https://www.youtube.com/watch?v=ZIaOBAjvc38',title:'Sam Altman: “Never a Better Time to Do a Startup”'},
 kojima:{name:'WIRED · Hideo Kojima',url:'https://www.youtube.com/watch?v=02Ah5VQrzvA',title:'Hideo Kojima Answers Hideo Kojima Questions | Tech Support'}
};
const PLATFORM={douyin:{zh:'抖音',en:'Douyin'},xiaohongshu:{zh:'小红书',en:'Xiaohongshu'},tiktok:{zh:'TikTok',en:'TikTok'},shorts:{zh:'Shorts',en:'Shorts'}};
const STYLE={interview:{zh:'访谈式',en:'Interview'},podcast:{zh:'播客式',en:'Podcast'}};
const CLIPS=[
 {id:'07',p:'xiaohongshu',s:'interview',d:'2:53',src:'sam',zh:'AI 是权力放大器：均质化还是垄断化？',en:'AI amplifies power: levelling or monopoly?'},
 {id:'04',p:'tiktok',s:'podcast',d:'2:16',src:'dario',zh:'API 定价不会消失，token 价值会重写 AGI 经济',en:'API pricing won’t die — token value will redefine AGI economics'},
 {id:'09',p:'douyin',s:'interview',d:'1:13',src:'kojima',zh:'休学一年打马里奥，确信游戏将超越电影',en:'A year off school for Mario — and why games will beat film'},
 {id:'02',p:'douyin',s:'interview',d:'3:10',src:'dario',zh:'AI 军备竞赛：晚一年＝破产',en:'The AI arms race: a year late means bankrupt'},
 {id:'08',p:'shorts',s:'podcast',d:'2:40',src:'sam',zh:'创业，就是你对公平 AI 的贡献',en:'Starting a startup is your contribution to equitable AI'},
 {id:'03',p:'xiaohongshu',s:'interview',d:'2:30',src:'dario',zh:'AI 剪辑＝人类剪辑？1–3 年见分晓',en:'Will AI edit like a human? Ask again in 1–3 years'},
 {id:'06',p:'shorts',s:'podcast',d:'2:02',src:'dario',zh:'Claude Code 是先在内部用出来的',en:'Anthropic built Claude Code by using it internally first'},
 {id:'10',p:'douyin',s:'interview',d:'0:59',src:'kojima',zh:'《死亡搁浅》：主题即机制',en:'Death Stranding: the theme is the mechanic'},
 {id:'01',p:'douyin',s:'interview',d:'1:24',src:'dario',zh:'AI 学不会剪辑的真本事：边干边学',en:'What AI can’t learn about editing: learning on the job'}
];
const UI={zh:{play:'播放',close:'关闭',source:'原片',err:'暂时无法播放，请重试。',credit:'成片由 AutoClip 新版流程自动生成，未经人工修改，仅作效果展示。原片版权归原作者：'},
 en:{play:'Play',close:'Close',source:'Original',err:'Unable to play this video. Please try again.',credit:'Generated end to end by the new AutoClip pipeline, with no manual edits, shown only as a demonstration. Source videos belong to their creators: '}};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let lang='en',dialog,video,lastTrigger,io;
const L=o=>o[lang]||o.en;
const tag=c=>L(PLATFORM[c.p])+' · '+L(STYLE[c.s]);
function card(c){return `<button class="clip" type="button" data-clip="${c.id}"><span class="clip-media"><img src="${asset('clip-'+c.id+'.jpg')}" width="540" height="960" alt="" loading="lazy" decoding="async"><video muted loop playsinline preload="none" data-loop="${asset('clip-'+c.id+'-loop.mp4')}"></video><span class="tag tl">${tag(c)}</span><span class="tag br">${c.d}</span><span class="play-hint" aria-hidden="true">▶</span></span><h3>${L(c)}</h3><p>${SRC[c.src].name}</p></button>`;}
function credit(){const u=L(UI);return u.credit+Object.values(SRC).map(s=>`<a href="${s.url}" target="_blank" rel="noopener">${s.name.split(' · ')[0]} — ${s.title}</a>`).join(lang==='zh'?'；':'; ');}
function render(){
 lang=(document.documentElement.lang||'en').split('-')[0];if(!UI[lang])lang='en';
 const wall=document.querySelector('[data-wall]');if(wall)wall.innerHTML=CLIPS.map(card).join('');
 document.querySelectorAll('[data-tpl]').forEach(el=>{const c=CLIPS.find(x=>x.id===el.dataset.tpl);el.outerHTML=card(c).replace('class="clip"','class="clip" data-tpl="'+c.id+'"');});
 const cr=document.querySelector('[data-credit]');if(cr)cr.innerHTML=credit();
 document.querySelectorAll('[data-clip]').forEach(el=>el.addEventListener('click',()=>play(el.dataset.clip,el)));
 observe();
}
function observe(){
 io?.disconnect();if(reduce.matches)return;
 io=new IntersectionObserver(entries=>entries.forEach(e=>{const v=e.target.querySelector('video');if(e.isIntersecting){if(!v.src)v.src=v.dataset.loop;v.play().then(()=>v.classList.add('on')).catch(()=>{});}else{v.pause();}}),{threshold:.6});
 document.querySelectorAll('.clip').forEach(el=>io.observe(el));
}
function play(id,trigger){
 const c=CLIPS.find(x=>x.id===id);if(!c)return;lastTrigger=trigger;const u=L(UI),s=SRC[c.src];
 if(!dialog){dialog=document.createElement('dialog');dialog.className='player';dialog.innerHTML='<div class="player-in"><div class="player-head"><span></span><button type="button">×</button></div><video controls playsinline preload="none"></video><p class="player-err" role="alert" hidden></p><div class="player-foot"></div></div>';document.body.append(dialog);video=dialog.querySelector('video');dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();lastTrigger?.focus({preventScroll:true});});dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});video.addEventListener('error',()=>{if(dialog.open&&video.hasAttribute('src'))dialog.querySelector('.player-err').hidden=false;});}
 dialog.querySelector('.player-head span').textContent=L(c);dialog.querySelector('button').setAttribute('aria-label',u.close);
 const err=dialog.querySelector('.player-err');err.textContent=u.err;err.hidden=true;
 dialog.querySelector('.player-foot').innerHTML=`${tag(c)} · ${c.d} · ${u.source}: <a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`;
 video.poster=asset('clip-'+id+'.jpg');video.src=asset('clip-'+id+'.mp4');dialog.showModal();video.play().catch(()=>{});
}
document.querySelectorAll('[data-wall-step]').forEach(b=>b.addEventListener('click',()=>{const w=document.querySelector('[data-wall]');const step=(w.querySelector('.clip')?.offsetWidth||220)+18;w.scrollBy({left:step*2*(+b.dataset.wallStep),behavior:reduce.matches?'auto':'smooth'});}));
fetch('https://api.github.com/repos/zhouxiaoka/autoclip').then(r=>r.ok?r.json():null).then(d=>{if(!d||!d.stargazers_count)return;const n=d.stargazers_count;document.querySelectorAll('[data-stars]').forEach(el=>el.textContent=n>=1000?(n/1000).toFixed(1).replace(/\.0$/,'')+'k':String(n));}).catch(()=>{});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video?.pause();});
reduce.addEventListener('change',observe);
render();new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
