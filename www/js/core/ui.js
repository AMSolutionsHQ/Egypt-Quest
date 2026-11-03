function openCollection(){const ar=lang==="ar",m=$("bmenu");let n=0;
 const rows=SITES.map(s=>{const ok=done.has(s.id);if(ok)n++;return'<div class="bbtn collection-row" style="cursor:default"><b><span class="status-icon '+(ok?'is-done':'is-locked')+'" aria-hidden="true"></span>'+(ar?s.ar:s.en)+' · ★ '+starSum(s.id)+'/15</b><small>'+(ok?FACTS[s.id][ar?1:0]:L2("Finish this site's challenge to reveal a fact","أكمل تحدي هذا الموقع لتكشف معلومة"))+'</small></div>'}).join("")+achBox();
 m.innerHTML='<div class="box collection-box"><h2 style="color:var(--gold);margin:0 0 4px">'+L2("Collection","المجموعة")+'</h2><p style="margin:0 0 6px;color:var(--mut);font-size:13px">'+L2("Sites completed ","المواقع المكتملة ")+n+'/'+SITES.length+' · '+L2("Balance ","الرصيد ")+bal()+" · "+L2("Earned ","المكتسب ")+score+'</p><p class="save-note" style="margin:0 0 8px;font-size:12px;color:var(--mut)">'+L2("Progress saves automatically on this device","يُحفظ تقدمك تلقائيًا على هذا الجهاز")+'</p>'+rows+
 '<button class="bbtn" id="bk" style="text-align:center">'+L2("Backup / restore progress","نسخ احتياطي / استعادة التقدم")+'</button><button class="bbtn" id="rst" style="text-align:center">'+L2("Reset progress","إعادة ضبط التقدم")+'</button><button class="bbtn" id="cl" style="text-align:center">'+L2("Close","إغلاق")+'</button></div>';
 m.style.display="flex";$("cl").onclick=()=>{m.style.display="none"};$("bk").onclick=openBackup;let armed=false;
 $("rst").onclick=()=>{if(!armed){armed=true;$("rst").textContent=L2("Tap again to confirm","اضغط مرة أخرى للتأكيد");return}score=0;done.clear();seen.clear();for(const k in prog)delete prog[k];Object.keys(lvl).forEach(k=>delete lvl[k]);ach.clear();streak=0;lastDay="";dailyClaim="";for(const k in SR)delete SR[k];spent=0;inv.hint=5;inv.time=0;inv.boost=0;inv.freeze=0;inv.ward=0;curseOn=false;own.clear();theme="classic";themeMode="auto";qDay="";qIds=[];qp={};qcl={};chestAt=0;loginDay=0;for(const k in ENDL)delete ENDL[k];PR=Progression.fresh();trial=null;trialBack=null;sel=null;m.style.display="none";render()}}

/* ---------- UI ---------- */
function select(id){snd("tap");quipFor("select");sel=SITES.find(s=>s.id===id);if(!seen.has(id)){seen.add(id);score+=Math.round(10*RATE)}render()}
$("x").onclick=()=>{sel=null;render()};
$("lang").onclick=()=>{lang=lang==="en"?"ar":"en";render()};
function exitWorld(){runSeq++;mode="map";if(pendingReveal){revealAt={id:pendingReveal,t0:performance.now()};pendingReveal=null}bonusMode=false;ptr.clear();document.body.classList.remove("g");render();if(loginPending)openLogin()}
/* Enter: open the level list; on the next locked place (points mode) it buys the place — two taps to confirm */
let buyArm=null;
$("enter").onclick=()=>{if(!sel)return;const i=SITES.indexOf(sel);
 if(!unlocked(i)){if(!pointsMode()||!unlocked(i-1)||bal()<placeCostOf(i))return;
  if(buyArm!==sel.id){buyArm=sel.id;setRich($("enter"),["@coin"," "+L2("Tap again to spend "+placeCostOf(i)+" points","اضغط مرة أخرى لدفع "+placeCostOf(i)+" نقطة")]);return}
  buyArm=null;if(buyPlace(i))render();return}
 openLevels()};
$("gback").onclick=exitWorld;$("ginfo").onclick=()=>showIntro(null);
$("hintbtn").onclick=()=>{if(inv.hint<1){adForHints();return}const rem=cur.arts.map((a,i)=>i).filter(i=>!found.has(i));if(!rem.length)return;
 hintIdx=rem[Math.floor(Math.random()*rem.length)];hintUntil=performance.now()+2500;inv.hint--;huntHints++;
 const a=cur.arts[hintIdx];V.ox=W/2-a[0]*V.z;V.oy=H/2-a[1]*V.z;clampV();render()};
const unSet=new Set();let unInit=false;
function checkUnlocks(){SITES.forEach((st,i)=>{if(unlocked(i)&&!unSet.has(st.id)){unSet.add(st.id);if(unInit){toastTx=L2("New place unlocked: ","مكان جديد: ")+(lang==="ar"?st.ar:st.en);toastT=performance.now()+3500;snd("win")}}});unInit=true}
const chestShort=()=>{const ms=chestAt-Date.now();if(ms<=0)return L2("OPEN","افتح");const m=Math.ceil(ms/60000);return Math.floor(m/60)+"h"+m%60+"m"};
/* Fill an element with text and vector icons: setRich(el,["Points: 5 ","@flame","3"]).
   "@name" → <span class="ico ico-name">, styled in css/style.css (CSS-mask icons take the text colour). */
function setRich(el,parts){el.textContent="";for(const p of parts){if(typeof p==="string"&&p[0]==="@"&&p.length>1){const i=document.createElement("span");i.className="ico ico-"+p.slice(1);i.setAttribute("aria-hidden","true");el.appendChild(i)}else el.appendChild(document.createTextNode(String(p)))}}
function render(){checkUnlocks();newQuestDay();checkAch();save();const t=T[lang],ar=lang==="ar";
 document.documentElement.lang=lang;document.documentElement.dir=ar?"rtl":"ltr";
 $("title").textContent=t.title;setRich($("score"),["@coin"," "+bal(),...(streak>0?["  ","@flame",String(streak)]:[])]);$("score").setAttribute("aria-label",t.score+": "+bal()+(streak>0?" · "+L2("streak ","تتابع ")+streak:""));$("score").title=t.score;{/* v4.6 phase 2: map hint = how-to tip (first visits only) + next place with a progress bar */
 const nx=nextLocked(),h=$("hint");h.textContent="";
 if(done.size<2){const tip=document.createElement("span");tip.className="hint-tip";tip.textContent=t.hintMap;h.appendChild(tip)}
 if(nx>=0){const row=document.createElement("span");row.className="hint-next";const tx=document.createElement("span");tx.className="hint-tx";setRich(tx,["@lock"," "+L2("Next: ","التالي: ")+(ar?SITES[nx].ar:SITES[nx].en)+" — "+lockText(nx)]);row.appendChild(tx);
  const pp=placeProg(nx);if(pp){const bar=document.createElement("i");bar.className="hint-bar";const f=document.createElement("b");f.style.width=Math.round(100*Math.min(1,pp.frac||0))+"%";bar.appendChild(f);row.appendChild(bar)}h.appendChild(row)}
 h.classList.toggle("empty",!h.childNodes.length)}
 setRich($("ankh"),["@ankh"," "+PR.tok]);$("ankh").setAttribute("aria-label",L2("Ankh: ","عنخ: ")+PR.tok);$("ankh").title=L2("Ankh — unlocks levels","عنخ — يفتح المستويات");$("lang").textContent=ar?"English":"العربية";
 const idx=sel?SITES.indexOf(sel):0,lk=!!sel&&!unlocked(idx);
 {const canBuy=lk&&pointsMode()&&unlocked(idx-1)&&bal()>=placeCostOf(idx);if(!sel||buyArm!==sel.id)buyArm=null;
  if(lk&&buyArm)setRich($("enter"),["@coin"," "+L2("Tap again to spend "+placeCostOf(idx)+" points","اضغط مرة أخرى لدفع "+placeCostOf(idx)+" نقطة")]);
  else if(lk)setRich($("enter"),[canBuy?"@coin":"@lock"," "+lockText(idx)]);else $("enter").textContent=t.enter;$("enter").disabled=lk&&!canBuy}
 const cs=mode==="world"&&cur&&cur.bonus?cur.bonus[ar?1:0]:mode==="world"&&sel?(ar?sel.ar:sel.en):"";setRich($("gtitle"),[...(cur&&cur.bonus?[]:[L2("Lv ","م ")+curLevel,...(curseRun?[" ","@skull"]:[])," · "]),"@coin"," "+bal()+" · "+cs]);$("gtitle").title=cs;$("gback").textContent=t.back;
 $("gline").textContent="";$("ginfo").style.display=cur&&cur.bonus?"none":"";{const hb=$("hintbtn");hb.textContent="";const e=document.createElement("span");e.className="e";e.dataset.icon="hint";const l=document.createElement("span");l.className="l";setRich(l,inv.hint>0?[String(inv.hint)]:Ads.canReward()?["@play","+"+ADS.rewardedHints]:["0"]);hb.append(e,l);hb.setAttribute("aria-label",L2("Hint","تلميح"))}$("hintbtn").style.display=cur&&cur.game?"none":"";
 if(cur&&mode==="world"&&!cur.game){const n=found.size,tot=cur.arts.length;$("tray").textContent=L2("Found ","وُجد ")+n+"/"+tot}
 {const tk=sel&&mode==="map"&&sel.ticketUrl;$("itix").style.display=tk?"inline-block":"none";if(tk){setRich($("itix"),["@ticket"," "+L2("Book tickets","احجز التذاكر")]);$("itix").onclick=e=>{e.preventDefault();openExternal(sel.ticketUrl)}}}
 const sb=(side,icon,label,onclick,cls)=>{const b=document.createElement("button");b.className="sbtn"+(cls?" "+cls:"");const e=document.createElement("span");e.className="e";e.dataset.icon=icon;e.setAttribute("aria-hidden","true");const l=document.createElement("span");l.className="l";Array.isArray(label)?setRich(l,label):l.textContent=label;b.appendChild(e);b.appendChild(l);if(onclick)b.onclick=onclick;$(side).appendChild(b);return l};
$("lside").innerHTML="";$("rside").innerHTML="";
{const dI=getDaily(),dn=dailyClaim===today(),dl=sb("lside","daily",dn?["✓",...(streak>1?[" ","@flame",String(streak)]:[])]:L2("Daily","يومي"),()=>{select(dI);if(unlocked(SITES.findIndex(x=>x.id===dI)))openLevels()},dn?"done":"");
 chestEl=sb("lside","chest",chestShort(),openChest);
 {const ql=sb("lside","quests",qDone()+"/3",openQuests,qDone()>=3?"done":""),n=qIds.filter(id=>(qp[id]||0)>=QDEFS.find(q=>q.id===id).goal&&!qcl[id]).length;
 if(n){const bd=document.createElement("span");bd.className="sbadge";bd.textContent=n;bd.setAttribute("aria-label",L2(n+" to claim",n+" للاستلام"));ql.parentNode.appendChild(bd)}}
 if(eventMult()>1)sb("lside","event","×2",null,"done")}
sb("rside","bonus",L2("Bonus","إضافي"),openBonus);sb("rside","book",L2("Book","السجل"),openCollection);sb("rside","shop",L2("Shop","المتجر"),openShop);

 const inf=$("info");if(sel&&mode==="map"){inf.style.display="block";$("iname").textContent=ar?sel.ar:sel.en;$("iera").textContent=ar?sel.eraAr:sel.eraEn;
  {const a=$("iart");if(a.dataset.id!==sel.id){a.dataset.id=sel.id;a.innerHTML='<img src="'+placeArt(sel.id)+'" alt="" decoding="async">'}}
  {const c=$("ichips");c.textContent="";const chip=(parts,cls)=>{const s=document.createElement("span");s.className="chip2"+(cls?" "+cls:"");setRich(s,parts);c.appendChild(s)};
   const b=SR[sel.id]||[],nDone=[0,1,2,3,4].filter(i=>Progression.levelDone(SR,PR,sel.id,i)).length;
   chip(["@gamepad"," "+CH[sel.id][ar?1:0]]);chip(["@star"," "+starSum(sel.id)+"/15"],"is-star");if(!lk)chip(["@check"," "+L2(nDone+" of 5 levels",nDone+" من 5 مستويات")],"is-ok")}
  setRich($("idesc"),[(ar?sel.dAr:sel.dEn),...(lk?["\n","@lock"," "+lockText(idx)]:["\n",placeGoalTxt(idx)])])}else inf.style.display="none";Ads.update()}

/* Rewarded ad: +N hints (offered when you are out of hints, and in the shop) */
async function adForHints(after){if(!Ads.canReward()){toastTx=L2("Out of hints — get more in the shop","انتهت التلميحات — اشترِ المزيد من المتجر");toastT=performance.now()+2200;return}
 const ok=await Ads.rewarded("hints");if(ok){inv.hint+=ADS.rewardedHints;toastTx="+"+ADS.rewardedHints+" "+L2("hints","تلميحات");toastT=performance.now()+1800;snd("ok")}
 else{toastTx=L2("No ad available right now","لا يوجد إعلان متاح الآن");toastT=performance.now()+2000}render();after&&after()}

/* Keep rendered interface text consistent even when older game modules provide emoji labels. */
const UI_EMOJI=/[\u{1F000}-\u{1FAFF}\u{2705}\u{274C}\u{2764}\u{2B50}\u{2B1C}\u{23F0}-\u{23FA}\u{231A}\u{231B}\u{26A0}\u{26A1}\u{2620}\u{267E}\uFE0F]/gu; // emoji only — ★ ☆ ♥ ♡ ✓ ✗ are kept
/* v4.6: emoji that carry meaning become the matching vector icon (same set as the HUD); the rest are dropped. */
const EMOJI_ICON={"💡":"bulb","⏱":"clock","⏰":"clock","⌛":"clock","⚡":"bolt","🧊":"snowflake","🛡":"shield","🎬":"video","📺":"video","🔥":"flame","🎁":"gift","📋":"target","🛒":"bag","🛍":"bag","💾":"download",
 "🎮":"gamepad","☠":"skull","💀":"skull","🎉":"sparkle","🌅":"sparkle","🍀":"sparkle","🏅":"trophy","🏆":"trophy","🗺":"map","💔":"heart","❤":"heart","✅":"check","❌":"close","⬜":"lock","🔒":"lock","⭐":"star","🌙":"moon","♾":"infinity","⚠":"info","📜":"book"};
const UI_EMOJI_ONE=new RegExp(UI_EMOJI.source,"u");
function cleanUiEmoji(root=document.body){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const a=[];while(w.nextNode()){const n=w.currentNode;if(UI_EMOJI_ONE.test(n.nodeValue)&&!(n.parentNode&&/^(TEXTAREA|SCRIPT|STYLE)$/.test(n.parentNode.nodeName)))a.push(n)}
 a.forEach(n=>{const parts=n.nodeValue.split(/([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\uFE0F])/u);if(!n.parentNode)return;
  if(!parts.some(p=>EMOJI_ICON[p])){const v=n.nodeValue.replace(UI_EMOJI,"");if(v!==n.nodeValue)n.nodeValue=v;return}
  const f=document.createDocumentFragment();parts.forEach(p=>{if(!p)return;const ic=EMOJI_ICON[p];if(ic){const s=document.createElement("span");s.className="ico ico-"+ic;s.setAttribute("aria-hidden","true");f.appendChild(s)}else f.appendChild(document.createTextNode(p.replace(UI_EMOJI,"")))});
  n.parentNode.replaceChild(f,n)})}
const uiEmojiObserver=new MutationObserver(()=>{uiEmojiObserver.disconnect();cleanUiEmoji();uiEmojiObserver.observe(document.body,{subtree:true,childList:true,characterData:true})});
uiEmojiObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
if(window.CanvasRenderingContext2D){const fill=CanvasRenderingContext2D.prototype.fillText,stroke=CanvasRenderingContext2D.prototype.strokeText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){return fill.call(this,String(t).replace(UI_EMOJI,""),...a)};CanvasRenderingContext2D.prototype.strokeText=function(t,...a){return stroke.call(this,String(t).replace(UI_EMOJI,""),...a)}}
