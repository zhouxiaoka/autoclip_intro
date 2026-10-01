(()=>{'use strict';
const root=new URL('../',document.currentScript.src);
const STAGES=['download','asr','pick','package','render'];
const T={
 zh:{min:'分钟',stage:{download:'下载',asr:'语音识别',pick:'挑片段',package:'切点 · 取景 · 包装',render:'渲染'},
  pipeline:{old:'旧版',mid:'过渡版',new:'新版'},subs:{creator:'作者字幕',none:'无字幕'},
  s1:r=>`一条 ${hours(r.duration_sec,'zh')}的访谈，从贴链接到 ${r.rendered} 条成片（有作者字幕）`,
  s2:'一条 2–3 小时访谈的全部模型费用',s3:'条高质量成片，每条附封面、标题、简介和话题；更多备选点一下再做',s4:'次点击。不用剪辑器，也不用和 AI 来回对话',
  head:['视频','流程','链接到出片','片段 → 自动出片','模型调用','Tokens（入 / 出）','模型费用'],calls:n=>`${n} 次`,
  chartTitle:'时间花在哪',chartNote:'没有作者字幕时，语音识别在本地完成，用时会长一些，视频同样不离开你的电脑。',
  foot:b=>`${b.measured} 实测。${b.machine.zh}；分析模型 ${b.model}，每百万 tokens 输入 ¥${b.price.in_per_million}、输出 ¥${b.price.out_per_million}（${b.price.note.zh}），费用只含模型调用；语音识别为${b.asr.zh}。四条是不同的视频。默认只自动生成评分最高的 10 条，其余列为备选，点一下再做。`},
 en:{min:'min',stage:{download:'Download',asr:'Speech recognition',pick:'Clip picking',package:'Cuts · framing · packaging',render:'Rendering'},
  pipeline:{old:'Previous',mid:'Transitional',new:'New'},subs:{creator:'creator subtitles',none:'no subtitles'},
  s1:r=>`From pasted link to ${r.rendered} finished clips, for a ${hours(r.duration_sec,'en')} interview with creator subtitles`,
  s2:'Estimated text-model fees in two measured interviews',s3:'high-quality clips, each with a cover, title, description and tags; more backups are one click away',s4:'click. No editor, and no back-and-forth with an AI chat',
  head:['Video','Pipeline','Link to clips','Clips → made','Model calls','Tokens (in / out)','Model cost'],calls:n=>`${n}`,
  chartTitle:'Where the time goes',chartNote:'In these samples, missing subtitles were transcribed with local Whisper base. Cloud transcription is optional and sends audio to your selected provider.',
  foot:b=>`Measured ${b.measured}. ${b.machine.en}; analysis model ${b.model} at ¥${b.price.in_per_million} per million input tokens and ¥${b.price.out_per_million} per million output tokens (${b.price.note.en}); cost covers model calls only. Speech recognition: ${b.asr.en}. These are four different videos. The top 10 clips are made automatically; the rest wait as one-click backups.`}};
function hours(sec,lang){const h=Math.floor(sec/3600),m=Math.round(sec%3600/60);return lang==='zh'?`${h} 小时 ${m} 分钟`:`${h}h${String(m).padStart(2,'0')}m`;}
const k=n=>n>=10000?(n/10000).toFixed(1).replace(/\.0$/,'')+'万':String(n);
const kEn=n=>n>=1000?Math.round(n/1000)+'k':String(n);
let data,lang='en';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const host=document.querySelector('[data-benchmarks]');if(!host||!data)return;
 lang=(document.documentElement.lang||'en').split('-')[0];const u=T[lang]||T.en,L=o=>o[lang]||o.en;
 const head=data.runs.find(r=>r.id===data.headline),fresh=data.runs.filter(r=>r.pipeline==='new');
 const lo=Math.min(...fresh.map(r=>r.cost_cny)),hi=Math.max(...fresh.map(r=>r.cost_cny));
 const tok=lang==='zh'?k:kEn;
 const stats=`<div class="stats">
  <div class="stat"><b>${head.minutes}<small>${u.min}</small></b><span>${esc(u.s1(head))}</span></div>
  <div class="stat"><b>¥${lo.toFixed(1)}–${hi.toFixed(1)}</b><span>${u.s2}</span></div>
  <div class="stat"><b>${Math.min(...fresh.map(r=>r.rendered))}+</b><span>${u.s3}</span></div>
  <div class="stat"><b>1</b><span>${u.s4}</span></div></div>`;
 const chartRuns=data.chart.map(id=>data.runs.find(r=>r.id===id)).filter(r=>r&&r.stages);
 const max=Math.max(...chartRuns.map(r=>STAGES.reduce((a,s)=>a+r.stages[s],0)));
 const chart=`<div class="ribbon"><div class="ribbon-head"><h3>${u.chartTitle}</h3><div class="ribbon-key">${STAGES.map((s,i)=>`<span><i class="seg-${i}"></i>${u.stage[s]}</span>`).join('')}</div></div>
  ${chartRuns.map(r=>{const total=STAGES.reduce((a,s)=>a+r.stages[s],0);return `<div class="ribbon-row${r.pipeline==='new'?' new':''}"><div class="ribbon-label"><b>${esc(L(r.video))}</b><span>${u.pipeline[r.pipeline]} · ${u.subs[r.subtitles]}</span></div>
   <div class="ribbon-track"><div class="ribbon-bar" style="--w:${(total/max*100).toFixed(2)}%">${STAGES.map((s,i)=>r.stages[s]>0?`<i class="seg-${i}" style="flex:${r.stages[s]}" title="${u.stage[s]} ${r.stages[s]} ${u.min}"></i>`:'').join('')}</div><span class="ribbon-total mono">${r.minutes} ${u.min}</span></div></div>`;}).join('')}
  <p class="footnote">${u.chartNote}</p></div>`;
 const table=`<div class="runs"><table><thead><tr>${u.head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${data.runs.map(r=>`<tr class="${r.id===data.headline?'new':''}"><td><span class="dot"></span>${esc(L(r.video))} · ${hours(r.duration_sec,'en')}<em>${esc(L(r.route))}</em></td><td>${u.pipeline[r.pipeline]}${r.pipeline==='new'?` · ${u.subs[r.subtitles]}`:''}</td><td class="mono">${r.minutes} ${u.min}</td><td class="mono">${r.found} → ${r.rendered}</td><td class="mono">${u.calls(r.model_calls)}</td><td class="mono">${tok(r.tokens_in)} / ${tok(r.tokens_out)}</td><td class="mono">¥${r.cost_cny.toFixed(2)}</td></tr>`).join('')}</tbody></table></div>`;
 host.innerHTML=stats+chart+table+`<p class="footnote">${esc(u.foot(data))}</p>`;
 document.querySelectorAll('[data-bench]').forEach(el=>{const r=data.runs.find(x=>x.id===data.headline);el.textContent=el.dataset.bench==='flow'?(lang==='zh'?`${r.rendered} 条成片 · ${r.minutes} 分钟`:`${r.rendered} clips · ${r.minutes} min`):'';});
}
fetch(new URL('data/benchmarks.json',root)).then(r=>r.json()).then(d=>{data=d;render();}).catch(()=>{});
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
