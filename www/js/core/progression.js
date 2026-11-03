/* ============================================================
   Progression rules (v4.3) — pure functions, no DOM, no globals
   except the optional PROGRESSION config from config.js.
   Also loadable in Node for unit tests (tests/progression.test.js).

   State object P (saved as-is next to the old save fields):
     pv        : 2                         save-format version
     tok       : spendable Ankh tokens
     tokEarned : lifetime Ankh earned (never decreases)
     ul.sites  : [placeId]                 places unlocked (first place is always open)
     ul.levels : {placeId:[0|1 x5]}        levels unlocked with tokens (level 1 always open)
     cleared   : {placeId:[0|1 x5]}        levels passed through a Passage Trial (0★)
     trial.tok : {placeId:n}               Token Trials won per place
     trial.pass: {placeId:n}               Passage Trials won per place
     fails     : {placeId:[n x5]}          losses per level since the last win there
   SR is the existing best-stars table {placeId:[0..3 x5]} (levels 1–5).
   ============================================================ */
const Progression=(()=>{
 const N=5;
 const DEF={levelCost:[0,1,2,3,3],placeRule:{levels:3,stars:6},placeUnlock:"progress",placeCostStep:100,tokenTrialMax:2,passageTrialMax:1,passageAfterFails:3};
 const conf=c=>Object.assign({},DEF,(typeof PROGRESSION!=="undefined"&&PROGRESSION)||{},c||{});
 const arr=(o,id)=>o[id]||(o[id]=new Array(N).fill(0));
 const int=(v,min=0)=>{v=Math.floor(Number(v));return Number.isFinite(v)?Math.max(min,v):min};

 function fresh(){return{pv:2,tok:0,tokEarned:0,ul:{sites:[],levels:{}},cleared:{},trial:{tok:{},pass:{}},fails:{}}}

 /* ---------- levels ---------- */
 const best=(SR,id,li)=>int((SR[id]||[])[li]);
 const levelDone=(SR,P,id,li)=>best(SR,id,li)>0||!!(P.cleared[id]||[])[li];
 const levelOpen=(P,id,li)=>li===0||!!(P.ul.levels[id]||[])[li];
 const levelCost=(li,c)=>int(conf(c).levelCost[li]);
 /* "open" playable · "afford" can unlock now · "short" not enough tokens · "blocked" previous level not completed */
 function levelStatus(SR,P,id,li,c){if(levelOpen(P,id,li))return"open";if(!levelDone(SR,P,id,li-1))return"blocked";return P.tok>=levelCost(li,c)?"afford":"short"}
 /* Spend tokens to unlock a level. Never charges twice. */
 function unlockLevel(SR,P,id,li,c){const s=levelStatus(SR,P,id,li,c);if(s!=="afford")return{ok:false,reason:s};const cost=levelCost(li,c);P.tok-=cost;arr(P.ul.levels,id)[li]=1;return{ok:true,cost}}
 const endlessOpen=(SR,P,id)=>levelDone(SR,P,id,N-1);
 /* May this level number (1-based; 6+ = Endless) be started? */
 function canStart(SR,P,id,lv,endlBest){if(lv<1)return false;if(lv<=N)return levelOpen(P,id,lv-1);return endlessOpen(SR,P,id)&&lv<=Math.max(N,endlBest||N)+1}

 /* ---------- tokens ---------- */
 /* Tokens = improvement of the best star rating on levels 1–5. Replays only pay the difference,
    so the same stars can never be paid twice. */
 const award=(oldBest,newStars,li)=>li>=0&&li<N?Math.max(0,int(newStars)-int(oldBest)):0;
 function recordWin(P,id,li,oldBest,newStars){const a=award(oldBest,newStars,li);P.tok+=a;P.tokEarned+=a;if(li<N)arr(P.fails,id)[li]=0;return a}
 function recordLoss(P,id,li){if(li<0||li>=N)return 0;return ++arr(P.fails,id)[li]}
 function undoLoss(P,id,li){if(li<0||li>=N)return;const f=arr(P.fails,id);f[li]=Math.max(0,f[li]-1)}

 /* ---------- places ---------- */
 const ruleOf=(place,c)=>Object.assign({},conf(c).placeRule,place&&place.unlock||{});
 /* Progress of `place` toward opening the place after it. */
 function placeProgress(SR,P,place,rule){const id=place.id;let levels=0,stars=0;
  for(let li=0;li<N;li++){if(li<rule.levels&&levelDone(SR,P,id,li))levels++;stars+=Math.min(3,best(SR,id,li))}
  return{levels,needLevels:rule.levels,stars,needStars:rule.stars,ok:levels>=rule.levels&&stars>=rule.stars,
   frac:(Math.min(levels,rule.levels)/Math.max(1,rule.levels)+Math.min(stars,rule.stars)/Math.max(1,rule.stars))/2}}
 const placeOpen=(P,sites,i)=>i===0||(!!sites[i]&&P.ul.sites.includes(sites[i].id));
 /* placeUnlock:"points" — a place is bought with points, in map order (cost = step × position,
    or place.unlockCost). The caller spends the points; this only records the unlock. */
 const placeCost=(place,i,c)=>place&&place.unlockCost!=null?int(place.unlockCost):int(conf(c).placeCostStep)*Math.max(0,i);
 function buyPlace(P,sites,i,prevOpen,balance,c){if(i<1||!sites[i])return{ok:false,reason:"none"};if(placeOpen(P,sites,i))return{ok:false,reason:"open"};
  const cost=placeCost(sites[i],i,c);if(!prevOpen)return{ok:false,reason:"blocked",cost};if(!(balance>=cost))return{ok:false,reason:"short",cost};
  P.ul.sites.push(sites[i].id);return{ok:true,cost}}
 /* Unlock every place whose previous place meets its rule (progress mode only). Returns the newly opened ids (in order). */
 function refreshSites(SR,P,sites,c){const out=[];if(conf(c).placeUnlock==="points")return out;
  for(let i=1;i<sites.length;i++){const id=sites[i].id;if(P.ul.sites.includes(id))continue;
   if(placeOpen(P,sites,i-1)&&placeProgress(SR,P,sites[i-1],ruleOf(sites[i],c)).ok){P.ul.sites.push(id);out.push(id)}}
  return out}
 /* The last place has no successor: finishing it (same rule) completes the journey. */
 function journeyDone(SR,P,sites,c){const n=sites.length;if(!n)return false;for(let i=1;i<n;i++)if(!placeOpen(P,sites,i))return false;
  return placeProgress(SR,P,sites[n-1],ruleOf(null,c)).ok}

 /* ---------- Scribe's Trials (no ads, no purchases) ---------- */
 /* Token Trial: first level that is blocked only by a lack of tokens. -1 = none. */
 function tokenTrialLevel(SR,P,id,c){c=conf(c);if(int(P.trial.tok[id])>=c.tokenTrialMax)return -1;
  for(let li=1;li<N;li++)if(levelStatus(SR,P,id,li,c)==="short")return li;return -1}
 /* Passage Trial: after N losses in a row on an open, not-yet-completed level. */
 function passageTrial(SR,P,id,li,c){c=conf(c);return li>=0&&li<N&&levelOpen(P,id,li)&&!levelDone(SR,P,id,li)&&
  int(P.trial.pass[id])<c.passageTrialMax&&int((P.fails[id]||[])[li])>=c.passageAfterFails}
 /* Apply a won trial. Re-checks eligibility, so it can't be applied twice. */
 function applyTrial(SR,P,kind,id,li,c){
  if(kind==="tok"){if(tokenTrialLevel(SR,P,id,c)<0)return false;P.trial.tok[id]=int(P.trial.tok[id])+1;P.tok++;P.tokEarned++;return true}
  if(kind==="pass"){if(!passageTrial(SR,P,id,li,c))return false;P.trial.pass[id]=int(P.trial.pass[id])+1;arr(P.cleared,id)[li]=1;arr(P.fails,id)[li]=0;return true}
  return false}

 /* ---------- persistence ---------- */
 /* Old saves (no pv): keep everything that was open under the v4.1 rules and give
    tokens = sum of best stars, so nobody loses access or progress. */
 function migrate(SR,doneIds,sites){const P=fresh(),has3=id=>(SR[id]||[]).some(v=>v>=3),dn=new Set(doneIds||[]);
  sites.forEach((s,i)=>{if(i===0)return;if(has3(sites[i-1].id)||dn.has(s.id))P.ul.sites.push(s.id)});
  for(const id in SR){const b=SR[id]||[],lv=new Array(N).fill(0);let t=0;
   for(let li=0;li<N;li++){if(li>0&&int(b[li-1])>0)lv[li]=1;if(int(b[li])>0)lv[li]=1;t+=Math.min(3,int(b[li]))}
   P.ul.levels[id]=lv;P.tok+=t}
  P.tokEarned=P.tok;return P}
 /* Validate a saved/restored P. Unknown ids and bad values are dropped. */
 function sanitize(raw,siteIds){const P=fresh(),ok=new Set(siteIds||[]),r=raw&&typeof raw==="object"?raw:{};
  const bits=a=>Array.from({length:N},(_,i)=>Array.isArray(a)&&a[i]?1:0),nums=a=>Array.from({length:N},(_,i)=>Array.isArray(a)?int(a[i]):0);
  P.tok=int(r.tok);P.tokEarned=Math.max(P.tok,int(r.tokEarned));
  const ul=r.ul||{};(Array.isArray(ul.sites)?ul.sites:[]).forEach(id=>{if(ok.has(id)&&!P.ul.sites.includes(id))P.ul.sites.push(id)});
  for(const id in(ul.levels||{}))if(ok.has(id))P.ul.levels[id]=bits(ul.levels[id]);
  for(const id in(r.cleared||{}))if(ok.has(id))P.cleared[id]=bits(r.cleared[id]);
  for(const id in(r.fails||{}))if(ok.has(id))P.fails[id]=nums(r.fails[id]);
  const tr=r.trial||{};for(const k of["tok","pass"])for(const id in(tr[k]||{}))if(ok.has(id))P.trial[k][id]=int(tr[k][id]);
  return P}
 const toSave=P=>({pv:2,tok:P.tok,tokEarned:P.tokEarned,ul:P.ul,cleared:P.cleared,trial:P.trial,fails:P.fails});

 return{N,DEF,conf,fresh,levelDone,levelOpen,levelCost,levelStatus,unlockLevel,endlessOpen,canStart,award,recordWin,recordLoss,undoLoss,
  ruleOf,placeProgress,placeOpen,placeCost,buyPlace,refreshSites,journeyDone,tokenTrialLevel,passageTrial,applyTrial,migrate,sanitize,toSave};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=Progression;
