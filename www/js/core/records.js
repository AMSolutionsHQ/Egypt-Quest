/* ============================================================
   Records (v5.1) — personal bests kept on this device only.
   runs : the 10 best results by coins earned, newest first on ties
          {i:place or bonus id, l:level (0 = bonus game), c:coins, t:seconds, s:stars, d:"YYYY-MM-DD"}
   bt   : fastest win per place and level {placeId:[seconds ×5]} (0 = none yet)
   Shown in Progress as "Best runs · on this device" — never presented as a global ranking.
   ============================================================ */
const Records=(()=>{
 let runs=[],bt={};
 const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 function add(r){r=Object.assign({d:today()},r);runs.push(r);runs.sort((a,b)=>b.c-a.c||(b.d>a.d?1:-1));runs=runs.slice(0,10);return runs.indexOf(r)}
 /* returns true when this is a new fastest time for that level */
 function bestTime(id,li,secs){if(!(li>=0&&li<5)||!(secs>0))return false;const a=bt[id]||(bt[id]=[0,0,0,0,0]),s=Math.max(1,Math.round(secs));if(!a[li]||s<a[li]){const first=!a[li];a[li]=s;return !first}return false}
 const time=(id,li)=>(bt[id]||[])[li]||0;
 function clean(rawRuns,rawBt){const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v),int=(v,lo,hi)=>{v=Math.floor(Number(v));return Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):lo};
  const r=(Array.isArray(rawRuns)?rawRuns:[]).filter(isObj).filter(x=>typeof x.i==="string"&&x.i.length<=40).map(x=>({i:x.i,l:int(x.l,0,999),c:int(x.c,0,1e7),t:int(x.t,0,1e5),s:int(x.s,0,3),d:typeof x.d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.d)?x.d:""})).sort((a,b)=>b.c-a.c).slice(0,10);
  const b={};if(isObj(rawBt))for(const k in rawBt)if(k.length<=40&&Array.isArray(rawBt[k]))b[k]=[0,1,2,3,4].map(i=>int(rawBt[k][i],0,1e5));
  return{runs:r,bt:b}}
 return{add,bestTime,time,clean,get runs(){return runs},get bt(){return bt},
  load(d){const c=clean(d&&d.runs,d&&d.bt);runs=c.runs;bt=c.bt},reset(){runs=[];bt={}}};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=Records;
