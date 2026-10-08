(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const root=document.documentElement;
if(!reduce)root.classList.add('motion');

/* nav turns into a floating pill once the page moves */
const nav=document.querySelector('.nav');
const onNav=()=>nav?.classList.toggle('scrolled',scrollY>12);
addEventListener('scroll',onNav,{passive:true});onNav();

/* reveal on enter, staggered among siblings; also picks up nodes rendered later */
const SEL='.section .eyebrow,.section h2,.section .lede,.film-frame,.way,.stat,.ribbon-row,.runs,.panel .pane,.dlcard,.cta-card,.crow,.fcol,.stage-head,.lib-bar,.faq details,.dev li,.term';
const seen=new WeakSet();
const io=reduce?null:new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px',threshold:.12});
function scan(){if(reduce)return;document.querySelectorAll(SEL).forEach(el=>{if(seen.has(el))return;seen.add(el);el.classList.add('rv');const sib=[...el.parentElement.children].filter(c=>c.matches(SEL));el.style.setProperty('--rv',Math.min(sib.indexOf(el),8));io.observe(el);});}
let pending=0;new MutationObserver(()=>{clearTimeout(pending);pending=setTimeout(scan,60);}).observe(document.body,{childList:true,subtree:true});
scan();

/* illustrations "develop": coarse halftone dots that tighten into the picture */
const PAPER='#F3EFE6';
function cover(img,W,H){const iw=img.naturalWidth,ih=img.naturalHeight,s=Math.max(W/iw,H/ih),w=iw*s,h=ih*s;const pos=(getComputedStyle(img).objectPosition||'50% 50%').split(' ').map(v=>parseFloat(v)/100);return [(W-w)*(pos[0]||.5),(H-h)*(isNaN(pos[1])?.5:pos[1]),w,h];}
function develop(img){
 const host=img.parentElement,c=document.createElement('canvas');c.className='develop';c.setAttribute('aria-hidden','true');host.append(c);
 const start=()=>{
  const r=img.getBoundingClientRect(),W=Math.max(1,Math.round(r.width)),H=Math.max(1,Math.round(r.height)),dpr=Math.min(2,devicePixelRatio||1);
  c.width=W*dpr;c.height=H*dpr;const ctx=c.getContext('2d');ctx.scale(dpr,dpr);
  const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d',{willReadFrequently:true});
  const [x,y,w,h]=cover(img,W,H);o.drawImage(img,x,y,w,h);let px;try{px=o.getImageData(0,0,W,H).data;}catch{c.remove();return;}
  const D=1600,t0=performance.now();
  const frame=now=>{const t=Math.min(1,(now-t0)/D),e=1-Math.pow(1-t,3),cell=26-21*e;
   ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
   for(let cy=cell/2;cy<H;cy+=cell)for(let cx=cell/2;cx<W;cx+=cell){const i=((cy|0)*W+(cx|0))*4,R=px[i],G=px[i+1],B=px[i+2];const lum=(.3*R+.59*G+.11*B)/255;const rad=cell*.62*Math.sqrt(1-lum*.8);ctx.fillStyle=`rgb(${R},${G},${B})`;ctx.beginPath();ctx.arc(cx,cy,rad,0,6.283);ctx.fill();}
   if(t<1)requestAnimationFrame(frame);else{img.classList.add('developed');c.classList.add('done');setTimeout(()=>c.remove(),700);}};
  requestAnimationFrame(frame);
 };
 const go=()=>img.complete&&img.naturalWidth?start():img.addEventListener('load',start,{once:true});
 new IntersectionObserver((es,ob)=>{if(es[0].isIntersecting){ob.disconnect();go();}},{threshold:.25}).observe(img);
}
if(!reduce)document.querySelectorAll('img[data-develop]').forEach(develop);
else document.querySelectorAll('img[data-develop]').forEach(i=>i.classList.add('developed'));

/* footer overscroll: lift the page sheet, flip the art underneath */
const sheet=document.querySelector('.page-sheet');
const reveal=document.querySelector('.footer-reveal');
const revealEnd=document.querySelector('.footer-reveal-end');
if(sheet&&reveal&&revealEnd){
 if(reduce)reveal.querySelector('img')?.style.setProperty('opacity','1');
 else{
  const frames=[...reveal.querySelectorAll('img')];
  let atEnd=false,pull=0,hold=0,cur=-1,y=0,v=0,tgt=0,raf=0;
  new IntersectionObserver(([e])=>{atEnd=e.isIntersecting},{threshold:0}).observe(revealEnd);
  const setY=val=>{tgt=val;if(!raf)raf=requestAnimationFrame(step);};
  const reset=()=>{pull=0;hold=0;setY(0);};
  const drag=d=>{pull=Math.max(0,pull+d);setY(-(260*(1-Math.exp(-pull/500))));};
  const flip=now=>{const n=Math.floor(now/150)%frames.length;if(n===cur)return;if(cur>=0)frames[cur].style.opacity='0';frames[n].style.opacity='1';cur=n;};
  const step=now=>{
   const dt=Math.min(.032,1/60);
   v+=(260*(tgt-y)-24*v)/.9*dt;y+=v*dt;
   if(Math.abs(y)<.15&&Math.abs(v)<.15&&tgt===0){y=v=0;sheet.style.transform='';}
   else sheet.style.transform=`translate3d(0,${y.toFixed(2)}px,0)`;
   if(hold&&now>=hold)reset();
   if(pull>0||Math.abs(y)>.5)flip(now);
   raf=(pull>0||hold||Math.abs(y)>.15||Math.abs(v)>.15||tgt!==0)?requestAnimationFrame(step):0;
  };
  addEventListener('wheel',e=>{if(pull>0||(e.deltaY>0&&atEnd)){drag(e.deltaY);hold=performance.now()+140;}},{passive:true});
  let touchY=null;
  addEventListener('touchstart',e=>{touchY=e.touches[0].clientY},{passive:true});
  addEventListener('touchmove',e=>{if(touchY==null)return;const y0=e.touches[0].clientY,d=touchY-y0;touchY=y0;if(pull>0||(d>0&&atEnd))drag(d);},{passive:true});
  addEventListener('touchend',()=>{touchY=null;reset();},{passive:true});
 }
}

/* hero collage follows the pointer a little */
const art=document.querySelector('.hero-art');
if(art&&!reduce&&matchMedia('(pointer: fine)').matches){let tx=0,ty=0,x=0,y=0,raf=0;
 const loop=()=>{x+=(tx-x)*.08;y+=(ty-y)*.08;art.style.setProperty('--mx',x.toFixed(3));art.style.setProperty('--my',y.toFixed(3));raf=Math.abs(tx-x)+Math.abs(ty-y)>.002?requestAnimationFrame(loop):0;};
 addEventListener('pointermove',e=>{if(art.classList.contains('sent'))return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;if(!raf)raf=requestAnimationFrame(loop);},{passive:true});}
})();
