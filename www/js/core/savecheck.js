/* ============================================================
   Save-data validation (v4.4.1) — pure, no DOM, Node-testable.
   SaveCheck.clean(raw) returns a save object whose every field has the
   right type and range. Valid values pass through UNCHANGED (no reset,
   no migration); only broken values are replaced by the same defaults a
   new player gets. Unknown extra fields are kept (e.g. progression data,
   which core/progression.js validates itself).
   ============================================================ */
const SaveCheck=(()=>{
 const MAXI=Number.MAX_SAFE_INTEGER;
 const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
 const int=(v,def=0,min=0,max=MAXI)=>{const n=Number(v);return v!==null&&v!==""&&typeof v!=="boolean"&&Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):def};
 const num=(v,def=0)=>{const n=Number(v);return v!==null&&v!==""&&typeof v!=="boolean"&&Number.isFinite(n)?n:def};
 const str=(v,def="",max=200)=>typeof v==="string"?v.slice(0,max):def;
 const day=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:"";
 const bool=v=>v===true||v===1;
 const strs=(v,max=5000)=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==="string"&&x.length<=200))].slice(0,max):[];
 const mapOf=(v,f)=>{const o={};if(!isObj(v))return o;for(const k of Object.keys(v)){if(k.length>200)continue;const r=f(v[k]);if(r!==undefined)o[k]=r}return o};
 const THEMES=["classic","sunset","night"],MODES=["auto",...THEMES];
 const INV={hint:5,time:0,boost:0,freeze:0,ward:0};

 function clean(raw){const d=isObj(raw)?raw:{},inv=isObj(d.inv)?d.inv:{},out=Object.assign({},d);
  Object.assign(out,{
   score:int(d.score),spent:int(d.spent),
   done:strs(d.done),seen:strs(d.seen),ach:strs(d.ach),own:strs(d.own),
   muted:bool(d.muted),curseOn:bool(d.curseOn),
   prog:mapOf(d.prog,a=>Array.isArray(a)?a.filter(Number.isInteger):undefined),
   lvl:mapOf(d.lvl,x=>Number.isFinite(Number(x))&&x!==null&&x!==""?Number(x):undefined),
   streak:int(d.streak),loginDay:int(d.loginDay,0,0,7),chestAt:num(d.chestAt),
   lastDay:day(d.lastDay),dailyClaim:day(d.dailyClaim),dailyDay:day(d.dailyDay),qDay:day(d.qDay),dailyId:str(d.dailyId),
   SR:mapOf(d.SR,a=>Array.isArray(a)?[0,1,2,3,4].map(i=>int(a[i],0,0,3)):undefined),
   ENDL:mapOf(d.ENDL,x=>{const n=int(x,-1);return n>=5?n:undefined}),
   inv:Object.fromEntries(Object.keys(INV).map(k=>[k,int(inv[k],INV[k])])),
   theme:THEMES.includes(d.theme)?d.theme:"classic",
   qIds:strs(d.qIds,3),qp:mapOf(d.qp,x=>{const n=int(x,-1);return n>=0?n:undefined}),qcl:mapOf(d.qcl,x=>x?1:undefined)});
  if("themeMode" in d&&!MODES.includes(d.themeMode))delete out.themeMode;
  if("vibOn" in d)out.vibOn=d.vibOn!==false;if("motionOff" in d)out.motionOff=d.motionOff===true;if("lang" in d&&d.lang!=="en"&&d.lang!=="ar")delete out.lang;   // settings (v4.6): only normalised when present   // load() then picks the default
  return out}
 /* Parse a stored string; null if it is missing or not a JSON object */
 function parse(s){if(typeof s!=="string"||!s)return null;try{const d=JSON.parse(s);return isObj(d)?d:null}catch(e){return null}}
 return{clean,parse};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=SaveCheck;
