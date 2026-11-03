let lang="en",score=0,sel=null,mode="map",cur=null;const seen=new Set(),done=new Set();const need=i=>SITES[i]&&SITES[i].req!=null?SITES[i].req:50*i*(i+2);const has3=id=>(SR[id]||[]).some(v=>v>=3);
/* Progression state (Ankh tokens, unlocked places/levels, trials) — rules in core/progression.js.
   A place opens when the PREVIOUS place meets its rule (default: levels 1–3 completed + 6★).
   Places you already played stay open. Points stay a separate shop currency. */
let PR=Progression.fresh(),pendingReveal=null;
const unlocked=i=>i===0||(i>0&&!!SITES[i]&&(Progression.placeOpen(PR,SITES,i)||done.has(SITES[i].id)));
const nextLocked=()=>SITES.findIndex((s,i)=>!unlocked(i));
/* v4.5: places are bought with coins (config PROGRESSION.placeUnlock="points"), in map order */
/* v5.1 cosmetics: frame colour of the place markers on the map (bought in Shop → Charms) */
const FRAMES={gold:{en:"Gold",ar:"ذهبي",c:"#fff7dd",cost:0},lapis:{en:"Lapis",ar:"لازورد",c:"#5B95F2",cost:150},jade:{en:"Faience",ar:"فيروزي",c:"#3CC6A8",cost:250},carnelian:{en:"Carnelian",ar:"عقيق",c:"#F0675A",cost:300},amethyst:{en:"Amethyst",ar:"جمشت",c:"#B48CF0",cost:400}};
let frame="gold";
/* v4.6 phase 5: player settings (saved): vibration on mistakes, reduce motion (also follows the system setting) */
let vibOn=true,motionOff=false;
const motionReduced=()=>motionOff||!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
/* v4.6 phase 4: shared menu pieces — icon span and a sheet header with a back button */
const icn=n=>'<span class="ico ico-'+n+'" aria-hidden="true"></span>';
const menuHead=(icon,title,closeId,right)=>'<div class="mh"><button class="mh-back" id="'+closeId+'" aria-label="'+L2("Close","إغلاق")+'">'+icn("back")+'</button><h2>'+(icon?icn(icon):"")+'<span>'+title+'</span></h2>'+(right||"")+'</div>';
const coinChip=n=>'<span class="mh-chip is-coin">'+icn("coin")+n+'</span>';
/* v4.6: illustration of a place (assets/places/<id>.svg) */
const placeArt=id=>"assets/places/"+id+".svg";
const pointsMode=()=>PROGRESSION.placeUnlock==="points";
const placeCostOf=i=>Progression.placeCost(SITES[i],i);
const placeProg=i=>!(i>0&&SITES[i-1])?null:pointsMode()?{frac:unlocked(i-1)?Math.min(1,bal()/Math.max(1,placeCostOf(i))):0}:Progression.placeProgress(SR,PR,SITES[i-1],Progression.ruleOf(SITES[i]));
const progTxt=(pp,nm)=>L2("Complete levels 1–"+pp.needLevels+" ("+pp.levels+"/"+pp.needLevels+") and earn "+pp.needStars+"★ ("+Math.min(pp.stars,pp.needStars)+"/"+pp.needStars+") in "+nm[0],
 "أكمل المستويات 1–"+pp.needLevels+" ("+pp.levels+"/"+pp.needLevels+") واجمع "+pp.needStars+"★ ("+Math.min(pp.stars,pp.needStars)+"/"+pp.needStars+") في "+nm[1]);
const lockText=i=>{if(!(i>0&&SITES[i]))return"";if(pointsMode()){const c=placeCostOf(i);return!unlocked(i-1)?L2("Unlock "+SITES[i-1].en+" first","افتح "+SITES[i-1].ar+" أولًا"):bal()>=c?L2("Unlock for "+c+" coins","افتحه مقابل "+c+" عملة"):L2("Needs "+c+" coins (you have "+bal()+")","يحتاج "+c+" عملة (لديك "+bal()+")")}
 const pp=placeProg(i);return pp?progTxt(pp,[SITES[i-1].en,SITES[i-1].ar]):""};
/* Spend points to open place i. Returns true when it opened. */
function buyPlace(i){const r=Progression.buyPlace(PR,SITES,i,unlocked(i-1),bal());if(!r.ok)return false;spent+=r.cost;
 revealAt={id:SITES[i].id,t0:performance.now()};return true} // render() → checkUnlocks() announces it
const $=id=>document.getElementById(id);
const lvl={},ach=new Set();let streak=0,lastDay="",dailyClaim="",dailyDay="",dailyId="",lastWin=0,lastFirst=false,lastDaily=0,lastStars=1,lastLvlUnlock=false,lastBoost=false,huntMiss=0,huntHints=0,lastEvent=false,lastTime=0,lastPar=1,lastPerf=1,lastTs=1,lastSite=null;
const today=()=>dstr(0);
let curLevel=1,runWon=false,runStart=0,lastFindT=0;const LV=()=>curLevel-1;
function getDaily(){const d=today();if(dailyDay!==d||!SITES.some((s,i)=>s.id===dailyId&&unlocked(i))){let h=0;for(const c of d)h=(h*31+c.charCodeAt(0))>>>0;const un=SITES.filter((s,i)=>unlocked(i));dailyId=un[h%un.length].id;dailyDay=d}return dailyId}
function claimDaily(id){if(id!==getDaily()||dailyClaim===today())return 0;dailyClaim=today();return 100+10*Math.min(streak,7)}
const dstr=(o=0)=>{const d=new Date(Date.now()+o*864e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const ENDL={};let loginDay=0,loginPending=false,pendingMs=null,freezeUsed=false,chestAt=0,chestEl=null,qDay="",qIds=[],qp={},qcl={};
const eventMult=()=>{const w=new Date().getDay();return w===5||w===6?2:1};
const SR={},own=new Set();let spent=0,theme="classic";const inv={hint:5,time:0,boost:0,freeze:0,ward:0};
const RATE=.25;/* global points multiplier: lower = fewer points earned */
const bal=()=>score-spent;
let curseOn=false,curseRun=false,curseLost=0,lastCurse=false,curseTax=0;
function loseBal(n){if((inv.ward||0)>0&&n>0){inv.ward--;toastTx="🛡️ "+L2("Ward blocked the curse!","الدرع صدّ اللعنة!");toastT=performance.now()+1500;return 0}n=Math.min(n,Math.max(0,bal()));if(n>0)spent+=n;return n}
const starSum=id=>(SR[id]||[]).reduce((a,b)=>a+b,0),totalStars=()=>SITES.reduce((a,s)=>a+starSum(s.id),0);
const TH={classic:{s1:"#0f4c75",s2:"#1b6ca8",l1:"#ead08f",l2:"#c99a55"},sunset:{s1:"#3b2a6b",s2:"#d4577a",l1:"#f3b36b",l2:"#b9663f"},night:{s1:"#050d1c",s2:"#12305a",l1:"#7a7a98",l2:"#46486a"}};
const THN_SHORT={classic:["Sunny","مشمس"],sunset:["Sunset","الغروب"],night:["Night","الليل"]}; // swatch labels
const THN={classic:["Classic (sunny)","كلاسيكي (مشمس)"],sunset:["Sunset","الغروب"],night:["Night","الليل"]};
const LVN=[["Easy","سهل"],["Normal","عادي"],["Hard","صعب"],["Expert","خبير"],["Legend","أسطوري"]];
const starTxt=n=>"★".repeat(n)+"☆".repeat(3-n);
/* Run-scoped timers: games use later() instead of setTimeout so a delayed callback
   from a finished/abandoned run can never fire into the map or into another game. */
let runSeq=0;
const later=(fn,ms)=>{const s=runSeq;return setTimeout(()=>{if(s===runSeq&&mode==="world")fn()},ms)};
/* Lives: every place run starts with ❤❤❤ (one less on level 5+). A mistake costs a heart; 0 = level lost. */
let lives=3,maxLives=3,runLost=false,hurtT=0,contUsed=false,loseT=0,pendingWin=0,doneMode="win",bonusKey="";
const hearts=()=>"♥".repeat(Math.max(0,lives))+"♡".repeat(Math.max(0,maxLives-lives)); // text hearts (not emoji)
let lastBestT=false,lastLostHeart=false,lastNewUnlock=false,lastTok=0,lastPrev=0,nextAct="play";
/* Scribe's Trial run ({kind,id,li}) and where to return after it; map reveal of a newly opened place */
let trial=null,trialBack=null,revealAt=null;
