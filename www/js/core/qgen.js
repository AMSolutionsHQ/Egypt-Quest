/* ============================================================
   QGen — fresh quiz questions from free, key-less APIs.
     • Wikidata SPARQL (query.wikidata.org): Egyptian actors (photos), films,
       pharaohs (photos), archaeological sites → governorate, governorate capitals.
       Bilingual (Arabic + English labels).
     • Open Trivia DB (opentdb.com): extra English history/mythology/geography
       questions; a session token guarantees no repeats from the API itself.
   No-repeat rule: every shown question's key is stored in localStorage
   (egyptquest.seen). Generators skip seen keys; a pool only recycles when exhausted.
   Results are cached (egyptquest.wd.*) so the game works offline after one load;
   if nothing is available the built-in banks are used.
   Question shape: {key, cat:[en,ar], q:[en,ar], opts:[[en,ar],...], ans:index, img?}
   ============================================================ */
const QGen=(()=>{
 const WD="https://query.wikidata.org/sparql?format=json&query=",TTL=3*864e5,PFX="egyptquest.";
 const ls={get(k){try{return JSON.parse(localStorage.getItem(PFX+k)||"null")}catch(e){return null}},set(k,v){try{localStorage.setItem(PFX+k,JSON.stringify(v))}catch(e){}}};
 const shuf=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const qid=u=>String(u).split("/").pop();
 /* photos with printed names give the answer away: skip covers, posters, logos, signatures */
 const textyImg=u=>/cover|magazine|poster|logo|signature|autograph|tunivisions|title|caption|stamp|banknote/i.test(decodeURIComponent(String(u||"")));
 const img=u=>u?String(u).replace(/^http:/,"https:")+"?width=360":null;
 const withTimeout=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error("timeout")),ms))]);

 /* ---------- seen store (no duplicates across sessions) ---------- */
 let seen=new Set(ls.get("seen")||[]);
 const isSeen=k=>seen.has(k);
 function markSeen(k){seen.add(k);if(seen.size>4000)seen=new Set([...seen].slice(-3000));ls.set("seen",[...seen])}
 function freshOf(list,keyFn,prefix){let f=list.filter(x=>!isSeen(keyFn(x)));
  if(!f.length&&list.length){[...seen].forEach(k=>{if(k.startsWith(prefix))seen.delete(k)});ls.set("seen",[...seen]);f=list.slice()} // pool exhausted → recycle it
  return f}

 /* ---------- Wikidata with cache ---------- */
 const Q={
  actors:`SELECT ?p ?ar ?en (SAMPLE(?im) AS ?img) (SAMPLE(?sx) AS ?sex) (MAX(?sl) AS ?pop) WHERE{?p wdt:P106 wd:Q33999;wdt:P27 wd:Q79;wdt:P18 ?im;wikibase:sitelinks ?sl. FILTER(?sl>5) OPTIONAL{?p wdt:P21 ?sx} ?p rdfs:label ?ar FILTER(lang(?ar)="ar") ?p rdfs:label ?en FILTER(lang(?en)="en")}GROUP BY ?p ?ar ?en`,
  films:`SELECT ?f ?far ?fen (MIN(YEAR(?d)) AS ?y) (COUNT(DISTINCT ?di) AS ?nd) (SAMPLE(?dar) AS ?dAr) (SAMPLE(?den) AS ?dEn) (GROUP_CONCAT(DISTINCT STRAFTER(STR(?c),"entity/");separator="|") AS ?cast) (MAX(?fs) AS ?pop) WHERE{?f wdt:P31 wd:Q11424;wdt:P495 wd:Q79;wdt:P577 ?d;wikibase:sitelinks ?fs. ?f rdfs:label ?far FILTER(lang(?far)="ar") OPTIONAL{?f rdfs:label ?fen FILTER(lang(?fen)="en")} OPTIONAL{?f wdt:P57 ?di. ?di rdfs:label ?dar FILTER(lang(?dar)="ar") OPTIONAL{?di rdfs:label ?den FILTER(lang(?den)="en")}} OPTIONAL{?f wdt:P161 ?c}}GROUP BY ?f ?far ?fen`,
  pharaohs:`SELECT ?p ?ar ?en (SAMPLE(?im) AS ?img) (MAX(?sl) AS ?pop) WHERE{?p wdt:P39 wd:Q37110;wdt:P18 ?im;wikibase:sitelinks ?sl. ?p rdfs:label ?ar FILTER(lang(?ar)="ar") ?p rdfs:label ?en FILTER(lang(?en)="en")}GROUP BY ?p ?ar ?en`,
  govs:`SELECT ?g ?ar ?en ?car ?cen WHERE{?g wdt:P31 wd:Q204910;wdt:P36 ?c. ?g rdfs:label ?ar FILTER(lang(?ar)="ar") ?g rdfs:label ?en FILTER(lang(?en)="en") ?c rdfs:label ?car FILTER(lang(?car)="ar") ?c rdfs:label ?cen FILTER(lang(?cen)="en")}`,
  sites:`SELECT ?s (SAMPLE(?ar) AS ?sar)(SAMPLE(?en) AS ?sen)(SAMPLE(?gar) AS ?gAr)(SAMPLE(?gen) AS ?gEn)(SAMPLE(?img) AS ?im) (MAX(?sl) AS ?pop) WHERE{?s wdt:P31/wdt:P279? wd:Q839954;wdt:P17 wd:Q79;wdt:P18 ?img;wikibase:sitelinks ?sl;wdt:P131+ ?g. ?g wdt:P31 wd:Q204910. ?s rdfs:label ?ar FILTER(lang(?ar)="ar") ?s rdfs:label ?en FILTER(lang(?en)="en") ?g rdfs:label ?gar FILTER(lang(?gar)="ar") ?g rdfs:label ?gen FILTER(lang(?gen)="en")}GROUP BY ?s`
 };
 const mem={},inflight={};
 function rows(name,force){
  if(mem[name])return Promise.resolve(mem[name]);
  const c=ls.get("wd2."+name);if(c&&c.rows&&!force&&Date.now()-c.t<TTL){mem[name]=c.rows;return Promise.resolve(c.rows)}
  if(inflight[name])return inflight[name];
  inflight[name]=withTimeout(fetch(WD+encodeURIComponent(Q[name]),{headers:{Accept:"application/sparql-results+json"}}).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}),30000)
   .then(j=>{const out=j.results.bindings.map(b=>{const o={};for(const k in b)o[k]=b[k].value;return o});mem[name]=out;ls.set("wd2."+name,{t:Date.now(),rows:out});return out})
   .catch(e=>{if(c&&c.rows){mem[name]=c.rows;return c.rows}throw e})            // stale cache beats nothing
   .finally(()=>{delete inflight[name]});
  return inflight[name]}
 const safe=name=>rows(name).catch(()=>[]);
 /* start downloading in the background so the first quiz is instant */
 function warm(){["actors","govs","pharaohs","sites","films"].forEach((n,i)=>setTimeout(()=>safe(n),1500+i*1200))}

 /* ---------- helpers to build multiple-choice ---------- */
 function mc(key,cat,q,ans,wrongPool,n,im){const seenT=new Set([ans[1]+"|"+ans[0]]),w=[];
  for(const x of shuf(wrongPool.slice())){const t=x[1]+"|"+x[0];if(seenT.has(t)||x[0]===ans[0]||x[1]===ans[1])continue;seenT.add(t);w.push(x);if(w.length>=n-1)break}
  if(w.length<n-1)return null;const opts=shuf([ans,...w]);return{key,cat,q,opts,ans:opts.indexOf(ans),img:im||null}}
 const nm=(en,ar)=>[en||ar,ar||en];
 /* most-known first: easy levels only use the top of each list */
 const top=(list,n)=>list.slice().sort((a,b)=>(+b.pop||0)-(+a.pop||0)).slice(0,n);
 const FEM="http://www.wikidata.org/entity/Q6581072";

 /* ---------- cinema generators (El Gouna) ---------- */
 const CAT={photo:["🎬 Who is this?","🎬 مين ده؟"],film:["🎬 Which film?","🎬 أنهي فيلم؟"],dir:["🎬 Director","🎬 المخرج"],year:["🎬 Release year","🎬 سنة العرض"],
  phar:["👑 Pharaohs","👑 الفراعنة"],site:["🏛 Monuments","🏛 الآثار"],gov:["🗺 Governorates","🗺 المحافظات"],trivia:["📚 Trivia","📚 معلومات عامة"]};
 function cinemaGen(actorsAll,filmsAll,n,lv,minYear){lv=lv||0;actorsAll=actorsAll.filter(a=>!textyImg(a.img));
  /* minYear: only films released from that year on (and the actors who appear in them); falls back to all if the pool is too small */
  if(minYear){const rf=filmsAll.filter(f=>+f.y>=minYear);if(rf.length>=30){filmsAll=rf;const cast=new Set();rf.forEach(f=>(f.cast||"").split("|").forEach(c=>c&&cast.add(c)));const ra=actorsAll.filter(a=>cast.has(qid(a.p)));if(ra.length>=15)actorsAll=ra}}const actors=top(actorsAll,lv<1?50:lv<3?110:400),films=top(filmsAll,lv<1?250:lv<3?700:4000);
  const byId={};actors.forEach(a=>byId[qid(a.p)]=a);const allIds=new Set(actorsAll.map(a=>qid(a.p)));
  const fl=films.filter(f=>f.far).map(f=>({...f,id:qid(f.f),cs:(f.cast||"").split("|").filter(Boolean)}));
  const titles=fl.map(f=>nm(f.fen,f.far));
  const gens={
   photo:()=>{const a=pick(freshOf(actors,x=>"ap:"+qid(x.p),"ap:"));if(!a)return null;const same=actorsAll.filter(x=>(x.sex===FEM)===(a.sex===FEM));
    return mc("ap:"+qid(a.p),CAT.photo,["Who is this star?","مين في الصورة دي؟"],nm(a.en,a.ar),same.map(x=>nm(x.en,x.ar)),n,img(a.img))},
   film:()=>{const cand=fl.filter(f=>f.cs.some(c=>byId[c]));const f=pick(freshOf(cand,x=>"sf:"+x.id,"sf:"));if(!f)return null;const star=byId[pick(f.cs.filter(c=>byId[c]))];
    const wrong=fl.filter(x=>x.id!==f.id&&!x.cs.includes(qid(star.p))).map(x=>nm(x.fen,x.far));
    const fem=star.sex===FEM;return mc("sf:"+f.id,CAT.film,[`Which film did ${star.en} appear in?`,fem?`${star.ar} شاركت في أنهي فيلم؟`:`${star.ar} شارك في أنهي فيلم؟`],nm(f.fen,f.far),wrong,n,img(star.img))},
   dir:()=>{const cand=fl.filter(f=>+f.nd===1&&f.dAr);const f=pick(freshOf(cand,x=>"fd:"+x.id,"fd:"));if(!f)return null;
    return mc("fd:"+f.id,CAT.dir,[`Who directed the film "${f.fen||f.far}"?`,`مين مخرج فيلم "${f.far}"؟`],nm(f.dEn,f.dAr),cand.map(x=>nm(x.dEn,x.dAr)),n)},
   year:()=>{const cand=fl.filter(f=>+f.y>1920&&(!minYear||+f.y>=minYear));const f=pick(freshOf(cand,x=>"fy:"+x.id,"fy:"));if(!f)return null;const y=+f.y,ys=new Set();const sp=minYear?5:12,lo=minYear?Math.min(y,minYear)-2:0;let g=0;while(ys.size<6&&g++<200){const d=(Math.floor(Math.random()*sp)+(minYear?1:2))*(Math.random()<.5?-1:1);if(y+d<=new Date().getFullYear()&&y+d>=lo)ys.add(y+d)}
    return mc("fy:"+f.id,CAT.year,[`In which year was "${f.fen||f.far}" released?`,`فيلم "${f.far}" اتعرض سنة كام؟`],[String(y),String(y)],[...ys].map(v=>[String(v),String(v)]),n)}};
  return gens}

 /* ---------- Egypt general-knowledge generators (bonus quiz) ---------- */
 function egyptGen(pharAll,sitesAll,govs,n){pharAll=pharAll.filter(p=>!textyImg(p.img));const phar=top(pharAll,70),sites=top(sitesAll.filter(x=>!/^(KV|TT|WV|QV|DB)\s?\d/i.test(x.sen)),120);
  const gl=govs.filter(g=>!g.en.toLowerCase().includes(g.cen.toLowerCase())&&!g.ar.includes(g.car));
  return{
   phar:()=>{const p=pick(freshOf(phar,x=>"ph:"+qid(x.p),"ph:"));if(!p)return null;return mc("ph:"+qid(p.p),CAT.phar,["Which ruler of Egypt is shown here?","أي حاكم لمصر يظهر هنا؟"],nm(p.en,p.ar),phar.map(x=>nm(x.en,x.ar)),n,img(p.img))},
   site:()=>{const s=pick(freshOf(sites,x=>"st:"+qid(x.s),"st:"));if(!s)return null;return mc("st:"+qid(s.s),CAT.site,[`In which governorate is ${s.sen}?`,`في أي محافظة يقع ${s.sar}؟`],nm(s.gEn,s.gAr),sites.map(x=>nm(x.gEn,x.gAr)),n,img(s.im))},
   gov:()=>{const g=pick(freshOf(gl,x=>"gc:"+qid(x.g),"gc:"));if(!g)return null;return mc("gc:"+qid(g.g),CAT.gov,[`What is the capital of ${g.en}?`,`ما عاصمة ${g.ar}؟`],nm(g.cen,g.car),govs.map(x=>nm(x.cen,x.car)),n)}}}

 /* ---------- Open Trivia DB (English only) ---------- */
 const dec=s=>{const t=document.createElement("textarea");t.innerHTML=s;return t.value};
 async function otdb(count){
  let tok=ls.get("otdbToken");
  const getTok=async()=>{const j=await withTimeout(fetch("https://opentdb.com/api_token.php?command=request").then(r=>r.json()),8000);tok=j.token;ls.set("otdbToken",tok);return tok};
  if(!tok)await getTok();
  const cat=pick([23,20]); // history, mythology
  const url=t=>`https://opentdb.com/api.php?amount=${count}&category=${cat}&type=multiple&token=${t}`;
  let j=await withTimeout(fetch(url(tok)).then(r=>r.json()),8000);
  if(j.response_code===3){await getTok();j=await withTimeout(fetch(url(tok)).then(r=>r.json()),8000)}
  if(j.response_code===4){await withTimeout(fetch("https://opentdb.com/api_token.php?command=reset&token="+tok),8000);j=await withTimeout(fetch(url(tok)).then(r=>r.json()),8000)}
  return(j.results||[]).map(r=>{const q=dec(r.question),a=dec(r.correct_answer),opts=shuf([a,...r.incorrect_answers.map(dec)]).map(x=>[x,x]);
   let h=0;for(const c of q)h=(h*31+c.charCodeAt(0))>>>0;return{key:"ot:"+h.toString(36),cat:CAT.trivia,q:[q,q],opts,ans:opts.findIndex(o=>o[0]===a),img:null,enOnly:true}}).filter(x=>!isSeen(x.key))}

 /* ---------- image preloading: questions whose photo fails are dropped ---------- */
 const loadImg=u=>new Promise(res=>{if(!u)return res(null);const im=new Image();im.decoding="async";const t=setTimeout(()=>res(null),7000);im.onload=()=>{clearTimeout(t);res(im)};im.onerror=()=>{clearTimeout(t);res(null)};im.src=u});
 async function finalize(list,n){const out=[];
  await Promise.all(list.map(async q=>{if(q.img){q.image=await loadImg(q.img);if(!q.image)q.bad=true}}));
  for(const q of list)if(!q.bad&&out.length<n&&!out.some(o=>o.key===q.key))out.push(q);return out}
 function draw(gens,kinds,count){const out=[];let guard=0;while(out.length<count&&guard++<count*12){const k=kinds[out.length%kinds.length],q=gens[k]&&gens[k]();if(q&&!out.some(o=>o.key===q.key))out.push(q)}return out}

 return{warm,markSeen,isSeen,shuf,
  /* El Gouna: n questions, kinds by level, `local` = fallback questions from the built-in bank */
  async cinema(count,opts,kinds,local,lv,minYear){try{
   if(navigator.onLine===false&&!mem.films&&!ls.get("wd2.films"))throw 0;const[actors,films]=await withTimeout(Promise.all([safe("actors"),safe("films")]),8000);
   const gens=cinemaGen(actors,films,opts,lv,minYear);
   const live=draw(gens,shuf(kinds.slice()),Math.ceil(count*1.6));
   const mix=shuf([...live,...shuf(local.filter(q=>!isSeen(q.key))).slice(0,Math.max(1,Math.round(count*.3)))]);
   const fin=await finalize(mix,count);if(fin.length>=count)return fin;
   return fin.concat(shuf(local.filter(q=>!fin.some(f=>f.key===q.key)))).slice(0,count)}catch(e){return shuf(local.filter(q=>!isSeen(q.key))).concat(shuf(local)).slice(0,count)}},
  /* Bonus quiz */
  async egypt(count,opts,local){try{
   if(navigator.onLine===false&&!mem.sites&&!ls.get("wd2.sites"))throw 0;const[phar,sites,govs]=await withTimeout(Promise.all([safe("pharaohs"),safe("sites"),safe("govs")]),8000);
   const gens=egyptGen(phar,sites,govs,opts);
   let live=draw(gens,shuf(["phar","site","gov","site","phar"]),Math.ceil(count*1.6));
   if(lang==="en"){try{live=live.concat(await withTimeout(otdb(Math.max(1,Math.round(count*.25))),6000))}catch(e){}}
   const loc=shuf(local.filter(q=>!isSeen(q.key))).slice(0,1);
   const fin=await finalize(shuf([...live,...loc]),count);if(fin.length>=count)return fin;
   return fin.concat(shuf(local.filter(q=>!fin.some(f=>f.key===q.key)))).slice(0,count)}catch(e){return shuf(local.filter(q=>!isSeen(q.key))).concat(shuf(local)).slice(0,count)}}
 }})();

/* ============================================================
   QuizView — shared renderer/controller for question games.
   cfg: {bg(t), timeLimit()→sec|0, onAnswer(ok), onEnd(correct,errs)}
   ============================================================ */
function makeQuizView(cfg){
 let qs=[],qi=0,picked=-1,wait=false,loading=false,correct=0,errs=0,qEnd=0,streak=0,popT=0,popTx="";
 const L=i=>lang==="ar"?1:0;
 function lay(){const q=qs[qi],bw=Math.min(W-60,440);ctx.font="bold 20px system-ui";const ls=wrapT(q.q[L()],bw),ty=178,tb=ty+(ls.length-1)*27;
  let ih=0,iw=0;const n=q.opts.length;
  if(q.image){ih=Math.min(200,H*.26,bw*.8);const minOpt=n*(40+10);if(tb+20+ih+14+minOpt>H-24)ih=Math.max(90,H-24-minOpt-tb-34);iw=Math.min(bw,ih*q.image.naturalWidth/Math.max(1,q.image.naturalHeight),ih*1.4)}
  const iy=tb+18,top=Math.max(206,(ih?iy+ih+16:tb+30)),bh=Math.max(38,Math.min(62,(H-top-28)/n-10));
  return{bw,ls,ty,top,bh,x:(W-bw)/2,ih,iw,iy}}
 function cover(im,x,y,w,h,r){ctx.save();rr(x,y,w,h,r);ctx.clip();const s=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();ctx.strokeStyle="#e6b84a";ctx.lineWidth=2;rr(x,y,w,h,r);ctx.stroke()}
 function show(){picked=-1;wait=false;const t=cfg.timeLimit?cfg.timeLimit():0;qEnd=t?performance.now()+t*1000:0;if(qs[qi])QGen.markSeen(qs[qi].key)}
 function answer(k){if(picked!==-1||wait)return;picked=k;wait=true;const ok=k===qs[qi].ans;if(ok){correct++;snd("ok");streak++;const was=runCombo;if(streak>runComboN){runComboN=streak;runCombo=comboMult(streak)}if(runCombo>was){popT=performance.now();popTx=L2("Combo ×"+runCombo+"!","كومبو ×"+runCombo+"!")}}else{errs++;snd("bad");streak=0}cfg.onAnswer&&cfg.onAnswer(ok);
  later(()=>{qi++;if(qi>=qs.length)cfg.onEnd(correct,errs);else show()},ok?850:1300)}
 return{
  load(p){loading=true;qs=[];qi=0;correct=0;errs=0;streak=0;popT=0;const t0=performance.now();
   p.then(list=>{qs=list;loading=false;if(typeof runStart!=="undefined")runStart+=performance.now()-t0;show()})},
  get count(){return qs.length||0},get streak(){return streak},
  pick:k=>answer(k),get answer(){return qs[qi]?qs[qi].ans:-1},   // used by tests (same path as a tap)
  /* status text: "3 in a row · ×1.2" once a streak starts */
  comboTxt(){return streak>=2?" · "+L2(streak+" in a row",streak+" متتالية")+(runCombo>1?" ×"+runCombo:""):""},get index(){return qi},get correct(){return correct},get errs(){return errs},get loading(){return loading},
  draw(t){cfg.bg(t);ctx.textAlign="center";
   if(loading||!qs[qi]){ctx.fillStyle="#f3ead2";ctx.font="bold 18px system-ui";ctx.fillText(L2("Loading new questions…","جاري تحميل أسئلة جديدة…"),W/2,H/2);
    ctx.strokeStyle="#e6b84a";ctx.lineWidth=4;ctx.beginPath();ctx.arc(W/2,H/2+40,16,t/200,t/200+4.5);ctx.stroke();return}
   const q=qs[qi],g=lay(),ar=lang==="ar";
   ctx.font="bold 14px system-ui";ctx.fillStyle="#e6b84a";ctx.fillText(q.cat[ar?1:0],W/2,148);
   ctx.font="bold 20px system-ui";ctx.fillStyle="#fff";g.ls.forEach((l,k)=>ctx.fillText(l,W/2,g.ty+k*27));
   if(q.image&&g.ih)cover(q.image,(W-g.iw)/2,g.iy,g.iw,g.ih,12);
   if(qEnd&&picked<0){const left=Math.max(0,(qEnd-t)/(cfg.timeLimit()*1000));ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(g.x,g.top-12,g.bw,5);ctx.fillStyle=left<.3?"#d9534f":"#e6b84a";ctx.fillRect(g.x,g.top-12,g.bw*left,5);if(left<=0&&!wait)answer(-2)}
   if(popT&&t-popT<1100){const k=(t-popT)/1100;ctx.save();ctx.globalAlpha=Math.min(1,(1-k)*2);ctx.font="700 22px Cairo, system-ui";ctx.fillStyle="#F2C35B";ctx.strokeStyle="rgba(11,20,38,.9)";ctx.lineWidth=5;ctx.lineJoin="round";const yy=g.top-26-k*22;ctx.strokeText(popTx,W/2,yy);ctx.fillText(popTx,W/2,yy);ctx.restore()}
   q.opts.forEach((o,k)=>{const y=g.top+k*(g.bh+10);let c="#2a2a45";if(picked!==-1){if(k===q.ans)c="#2e7d4f";else if(k===picked)c="#a33a3a"}
    ctx.fillStyle=c;rr(g.x,y,g.bw,g.bh,14);ctx.fill();ctx.strokeStyle="#e6b84a";ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle="#fff";let fs=17;ctx.font=fs+"px system-ui";const tx=o[ar?1:0];while(ctx.measureText(tx).width>g.bw-20&&fs>11){fs--;ctx.font=fs+"px system-ui"}ctx.fillText(tx,W/2,y+g.bh/2+6)})},
  tap(px,py){if(loading||!qs[qi]||picked!==-1||wait)return;const g=lay(),k=qs[qi].opts.findIndex((o,i)=>{const y=g.top+i*(g.bh+10);return px>=g.x&&px<=g.x+g.bw&&py>=y&&py<=y+g.bh});if(k>=0)answer(k)}}}
