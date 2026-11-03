const SAVE="egyptquest.v1",SAVE_BAK=SAVE+".bak",SAVE_BAD=SAVE+".corrupt";
/* v4.4.1: storage that never throws. If the device blocks storage (or it is full) the game keeps
   running from memory and tells the player once. */
let storageOK=true,storageWarned=false;
const store={get(k){try{return localStorage.getItem(k)}catch(e){storageOK=false;return null}},
 set(k,v){try{localStorage.setItem(k,v);storageOK=true;return true}catch(e){storageOK=false;return false}}};
function storageWarn(){if(storageOK||storageWarned)return;storageWarned=true;try{toastTx=L2("Progress can't be saved on this device (storage is blocked or full)","لا يمكن حفظ التقدم على هذا الجهاز (التخزين محظور أو ممتلئ)");toastT=performance.now()+5000}catch(e){}}
function save(){let s;try{const pg={};for(const k in prog)pg[k]=[...prog[k]];s=JSON.stringify({score,done:[...done],seen:[...seen],muted,prog:pg,lvl,ach:[...ach],streak,lastDay,dailyClaim,dailyDay,dailyId,SR,spent,inv,own:[...own],theme,qDay,qIds,qp,qcl,chestAt,loginDay,ENDL,curseOn,themeMode,vibOn,motionOff,lang,frame,runs:Records.runs,bt:Records.bt,...Progression.toSave(PR)})}catch(e){return}if(!store.set(SAVE,s))storageWarn()}
/* Load: every field is validated (core/savecheck.js). A save that can't be read is never thrown away:
   it is copied to SAVE_BAD and the last good save (SAVE_BAK, written on each successful load) is used. */
function load(){let raw=store.get(SAVE),d=SaveCheck.parse(raw);
 if(raw&&!d){if(!store.get(SAVE_BAD))store.set(SAVE_BAD,raw);d=SaveCheck.parse(store.get(SAVE_BAK));raw=null;if(d)console.warn("save unreadable — restored the last good copy")}
 if(d){try{applySave(SaveCheck.clean(d))}catch(e){console.warn("save apply failed",e)}if(raw)store.set(SAVE_BAK,raw)}
 if(!store.set("egyptquest.probe","1"))storageOK=false;storageWarn();updMute()}
function applySave(d){score=d.score;(d.done||[]).forEach(x=>done.add(x));(d.seen||[]).forEach(x=>seen.add(x));muted=!!d.muted;for(const k in(d.prog||{}))prog[k]=new Set(d.prog[k]);Object.assign(lvl,d.lvl||{});(d.ach||[]).forEach(x=>ach.add(x));streak=d.streak|0;lastDay=d.lastDay||"";dailyClaim=d.dailyClaim||"";dailyDay=d.dailyDay||"";dailyId=d.dailyId||"";Object.assign(SR,d.SR||{});spent=d.spent|0;Object.assign(inv,d.inv||{});(d.own||[]).forEach(x=>own.add(x));theme=d.theme||"classic";qDay=d.qDay||"";qIds=d.qIds||[];qp=d.qp||{};qcl=d.qcl||{};chestAt=d.chestAt||0;loginDay=d.loginDay||0;Object.assign(ENDL,d.ENDL||{});curseOn=!!d.curseOn;vibOn=d.vibOn!==false;motionOff=d.motionOff===true;if(d.lang==='en'||d.lang==='ar')lang=d.lang;Records.load(d);frame=FRAMES[d.frame]&&(d.frame==='gold'||own.has('frame_'+d.frame))?d.frame:'gold';
 /* v4.4: map style follows the sun by default; players who had picked Sunset/Night keep it */
 themeMode=["auto","classic","sunset","night"].includes(d.themeMode)?d.themeMode:(theme!=="classic"?theme:"auto");
 /* v4.3 progression: saves without pv are migrated once (everything open stays open, Ankh = best stars) */
 PR=d.pv>=2?Progression.sanitize(d,SITES.map(s=>s.id)):Progression.migrate(SR,[...done],SITES);Progression.refreshSites(SR,PR,SITES)}
function exportCode(){const pg={};for(const k in prog)pg[k]=[...prog[k]];return btoa(unescape(encodeURIComponent(JSON.stringify({v:2,...Progression.toSave(PR),score,done:[...done],seen:[...seen],prog:pg,lvl,ach:[...ach],streak,lastDay,SR,spent,inv,own:[...own],theme,ENDL,loginDay,chestAt,themeMode,frame,runs:Records.runs,bt:Records.bt}))))}
function openBackup(){const m=$("bmenu");
 m.innerHTML='<div class="box"><h2 style="color:var(--gold);margin:0 0 4px">💾 '+L2("Backup progress","نسخ احتياطي للتقدم")+'</h2><p style="margin:0 0 8px;color:var(--mut);font-size:13px">'+L2("Copy this code to move your progress to another device. To restore, paste a code below and tap Restore.","انسخ هذا الرمز لنقل تقدمك إلى جهاز آخر. للاستعادة الصق الرمز هنا واضغط استعادة.")+'</p>'+
 '<textarea id="bcode" rows="5" style="width:100%;box-sizing:border-box;background:#0e1420;color:var(--txt);border:1px solid #3a3f52;border-radius:8px;padding:8px;font-size:12px"></textarea><div id="bmsg" style="min-height:20px;color:var(--gold);font-size:13px"></div>'+
 '<button class="bbtn" id="bcopy" style="text-align:center">'+L2("Copy code","نسخ الرمز")+'</button><button class="bbtn" id="brest" style="text-align:center">'+L2("Restore from code","استعادة من الرمز")+'</button><button class="bbtn" id="bcl" style="text-align:center">'+L2("Close","إغلاق")+'</button></div>';
 m.style.display="flex";const ta=$("bcode"),msg=t=>{$("bmsg").textContent=t};ta.value=exportCode();
 $("bcopy").onclick=async()=>{ta.value=exportCode();ta.focus();ta.select();try{await navigator.clipboard.writeText(ta.value);msg(L2("Copied!","تم النسخ!"))}catch(e){msg(L2("Code selected — copy it manually","تم تحديد الرمز — انسخه يدويًا"))}};
 $("brest").onclick=()=>{try{const d0=JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))));if(!d0||(d0.v!==1&&d0.v!==2))throw 0;const d=SaveCheck.clean(d0);const ids=SITES.map(s=>s.id);
  score=Math.max(0,d.score|0);done.clear();seen.clear();(d.done||[]).filter(x=>ids.includes(x)).forEach(x=>done.add(x));(d.seen||[]).filter(x=>ids.includes(x)).forEach(x=>seen.add(x));
  for(const k in prog)delete prog[k];for(const k in(d.prog||{}))if(ids.includes(k))prog[k]=new Set((d.prog[k]||[]).filter(n=>Number.isInteger(n)));
  Object.keys(lvl).forEach(k=>delete lvl[k]);Object.assign(lvl,d.lvl||{});ach.clear();(d.ach||[]).forEach(x=>ach.add(x));streak=d.streak|0;lastDay=d.lastDay||"";for(const k in SR)delete SR[k];Object.assign(SR,d.SR||{});spent=d.spent|0;Object.assign(inv,{hint:5,time:0,boost:0,freeze:0,ward:0},d.inv||{});own.clear();(d.own||[]).forEach(x=>own.add(x));theme=d.theme||"classic";for(const k in ENDL)delete ENDL[k];Object.assign(ENDL,d.ENDL||{});loginDay=d.loginDay||0;chestAt=d.chestAt||0;themeMode=["auto","classic","sunset","night"].includes(d.themeMode)?d.themeMode:"auto";applyAutoTheme();Records.load(d);frame=FRAMES[d.frame]&&(d.frame==="gold"||own.has("frame_"+d.frame))?d.frame:"gold";
  PR=d.v>=2&&d.pv>=2?Progression.sanitize(d,ids):Progression.migrate(SR,[...done],SITES);Progression.refreshSites(SR,PR,SITES);trial=null;render();msg(L2("Progress restored!","تمت استعادة التقدم!"))}catch(e){msg(L2("Invalid code","رمز غير صالح"))}};
 $("bcl").onclick=()=>{m.style.display="none"}}
