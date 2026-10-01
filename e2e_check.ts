import fs from 'fs';
import { translateIdiomaticText } from '../src/engine/translator.js';
import { JsonFileLexiconRepository } from '../src/engine/lexiconRepo.js';
const U='/mnt/user-data/outputs/';
const rd=(p:string)=>fs.readFileSync(p,'utf-8').split('\n').filter(Boolean).map(l=>JSON.parse(l));
const all=rd(U+'yorubaowe_cleaned_dataset.jsonl'), test=rd(U+'heldout_test_set.jsonl');
const tid=new Set(test.map((r:any)=>r.yoruba));
const lex=JSON.parse(fs.readFileSync('src/data/lexicon.json','utf-8'));
const byY=new Map(lex.map((e:any)=>[e.yoruba,e.id]));
const LOG='/tmp/l.json';
const run=async(repo:any,t:string)=>{fs.writeFileSync(LOG,'[]');return translateIdiomaticText(t,'yo','en',{repo,logPath:LOG});};
(async()=>{
  const full=new JsonFileLexiconRepository('src/data/lexicon.json');
  // 1 exact, default settings (no maxSpan passed)
  let ok=0; for(const r of all){const x=await run(full,r.yoruba); if(x.spans.length===1&&x.spans[0].matchedIdiomId===byY.get(r.yoruba)&&!x.spans[0].disambiguationReason?.startsWith('Near')) ok++;}
  console.log('exact, default settings:',ok,'/',all.length);
  // 2 variants through the real engine
  let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
  let vn=0,vok=0,near=0;
  for(const r of all){const w=r.yoruba.split(/\s+/);if(w.length<6)continue;
    const i=Math.floor(rnd()*w.length);
    for(const t of [w.filter((_:any,k:number)=>k!==i).join(' '), w.slice(0,Math.ceil(w.length*.8)).join(' ')]){
      const x=await run(full,t);vn++;if(x.spans.length===1&&x.spans[0].matchedIdiomId===byY.get(r.yoruba)){vok++;if(x.spans[0].disambiguationReason?.startsWith('Near'))near++;}}}
  console.log('variants via engine:',vok,'/',vn,'(near-match used',near,')');
  // 3 held-out lexicon
  const ho=lex.filter((e:any)=>!tid.has(e.yoruba));fs.writeFileSync('/tmp/ho.json',JSON.stringify(ho));
  const hr=new JsonFileLexiconRepository('/tmp/ho.json');
  let acc=0,exactNew=0;for(const r of test){const x=await run(hr,r.yoruba);if(x.spans.length){acc++;}}
  console.log('held-out accepted by engine (exact or near):',acc,'/',test.length);
  // 4 short sentence stays fallback with real lexicon
  const s=await run(full,'Mo lọ sí ọjà');console.log('short sentence:',s.overallConfidence,s.translatedText);
  // 5 latency
  const ts:number[]=[];for(let i=0;i<150;i++){const r=all[i*3];const t0=performance.now();await run(full,r.yoruba);ts.push(performance.now()-t0);}
  ts.sort((a,b)=>a-b);console.log('latency ms mean',(ts.reduce((a,b)=>a+b)/ts.length).toFixed(1),'p95',ts[Math.floor(.95*ts.length)].toFixed(1));
})();
