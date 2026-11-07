/* ---------- GAMEPLAY V2: intro popup, speed stars, celebration, level scaling ---------- */
const parOf=id=>Math.round((PAR[id]||45)*(1+.35*(Math.min(curLevel,8)-1)));
function showIntro(go,opt){opt=opt||{};if(!opt.bonus&&!sel&&lastSite)sel=lastSite;if(!opt.bonus&&!sel)return;const ar=lang==="ar",m=$("bmenu"),g=cur&&cur.game;
 const help=g?g.help[ar?"ar":"en"]:(ar?"ابحث عن القطع الأثرية المخفية في المشهد ("+(6+Math.min(LV(),5))+" قطع) واضغط عليها. اسحب للتحرك وقرّب بالأصابع. استخدم 💡 إذا علقت.":"Find the hidden artifacts ("+(6+Math.min(LV(),5))+") in the scene and tap them. Drag to move around and pinch to zoom. Use 💡 if you get stuck.");
 const title=opt.bonus?(trial?L2("Scribe's Trial · ","اختبار الكاتب · "):"")+cur.bonus[ar?1:0]:(ar?sel.ar:sel.en);
 const ic=n=>'<span class="ico ico-'+n+'" aria-hidden="true"></span>';
 /* v4.6 phase 3: intro card — place art / game icon, title, how to play, rule tiles, Cancel + Start */
 const rule=(icn,txt,cls)=>'<div class="in-rule'+(cls?" "+cls:"")+'">'+icn+'<span>'+txt+'</span></div>';
 const extra=opt.bonus?(trial?'<p class="in-trial">'+ic("sparkle")+" "+(trial.kind==="tok"?L2("Reach the target to earn +1 Ankh (no coins).","حقق الهدف لتربح +1 عنخ (بدون عملات)."):L2("Reach the target to pass level "+(trial.li+1)+" (0★, no Ankh).","حقق الهدف لتجتاز المستوى "+(trial.li+1)+" (0★ بدون عنخ)."))+'</p>':""):
  '<div class="in-rules">'+rule('<span class="in-hearts">'+"♥".repeat(maxLives)+'</span>',L2(maxLives+" hearts — every mistake costs one","قلوب: "+maxLives+" — كل خطأ يكلّفك قلبًا"),"is-heart")+
  rule('<span class="in-stars">★★★</span>',L2("★★★ needs no lost hearts","★★★ بدون خسارة أي قلب")+' · '+STX[sel.id][ar?1:0])+
  rule(ic("clock"),L2("Finish within "+parOf(sel.id)+"s for the full speed bonus","أنهِ خلال "+parOf(sel.id)+" ثانية للحصول على مكافأة السرعة كاملة"))+'</div>';
 const head=opt.bonus?'<span class="in-ic">'+ic(trial?"sparkle":"gamepad")+'</span>':'<img class="in-art" src="'+placeArt(sel.id)+'" alt="" decoding="async">';
 m.innerHTML='<div class="box in-box"><div class="in-head">'+head+'<div class="in-ttl"><span class="in-kind">'+(opt.bonus?(trial?L2("Scribe's Trial","اختبار الكاتب"):L2("Bonus game","لعبة إضافية")):CH[sel.id][ar?1:0])+'</span><h2>'+title+(opt.bonus?"":" · "+L2("Level ","المستوى ")+curLevel)+'</h2></div></div>'+
  '<p class="in-help">'+help+'</p>'+extra+'<div class="in-btns">'+(go?'<button class="bbtn" id="ino">'+L2("Cancel","إلغاء")+'</button>':"")+'<button class="bbtn" id="igo">'+(go?ic("play")+" "+L2("Start","ابدأ"):L2("Continue","متابعة"))+'</button></div></div>';
 m.style.display="flex";$("igo").onclick=()=>{m.style.display="none";if(go)go()};if(go)$("ino").onclick=()=>{m.style.display="none"}}
function lvInfo(id,lv){const x=lv-1,f=LVINFO[id];return f?f(x,Math.min(x,4)):""}
/* Level list: shows Ankh balance, progress toward the next place, and per level:
   playable · unlock with Ankh · not enough Ankh (+ Token Trial) · previous level not completed. */
const ankh=n=>'<span class="ico ico-ankh" aria-hidden="true"></span>'+n,lockI='<span class="ico ico-lock" aria-hidden="true"></span> ';
function placeGoalTxt(si){const ar=lang==="ar",s=SITES[si],nx=si+1<SITES.length?si+1:-1;
 if(nx>=0){if(unlocked(nx))return L2(SITES[nx].en+" is open","المكان التالي مفتوح: "+SITES[nx].ar);return L2("Next place: ","المكان التالي: ")+(ar?SITES[nx].ar:SITES[nx].en)+" — "+lockText(nx)}
 if(Progression.journeyDone(SR,PR,SITES))return L2("Journey complete!","اكتملت الرحلة!");
 return L2("Journey: ","الرحلة: ")+progTxt(Progression.placeProgress(SR,PR,s,Progression.ruleOf(null)),[s.en,s.ar])}
function openLevels(){const ar=lang==="ar",m=$("bmenu"),id=sel.id,b=SR[id]||(SR[id]=[0,0,0,0,0]),si=SITES.indexOf(sel),tt=Progression.tokenTrialLevel(SR,PR,id),cl=PR.cleared[id]||[];
 const TR=L2("Scribe's Trial","اختبار الكاتب"),trLeft=k=>Math.max(0,(k==="tok"?PROGRESSION.tokenTrialMax:PROGRESSION.passageTrialMax)-(PR.trial[k][id]|0));
 /* v4.6 phase 2: level select = place illustration header + level cards (status tile · text · stars) */
 const icon=n=>'<span class="ico ico-'+n+'" aria-hidden="true"></span>',stars=n=>'<span class="lv-stars" aria-label="'+n+'/3">'+"★".repeat(n)+'<span class="off">'+"★".repeat(3-n)+'</span></span>';
 const row=(attrs,cls,ic,title,sub,right)=>'<button class="bbtn lvrow '+cls+'" '+attrs+'><span class="lv-ic">'+icon(ic)+'</span><span class="lv-tx"><b>'+title+'</b><small>'+sub+'</small></span>'+(right?'<span class="lv-st">'+right+'</span>':"")+'</button>';
 let nextI=-1;for(let i=0;i<5;i++)if(nextI<0&&Progression.levelStatus(SR,PR,id,i)==="open"&&!Progression.levelDone(SR,PR,id,i))nextI=i;
 const rows=[0,1,2,3,4].map(i=>{const st=Progression.levelStatus(SR,PR,id,i),dn=Progression.levelDone(SR,PR,id,i),cost=Progression.levelCost(i),nm=L2("Level ","المستوى ")+(i+1)+" · "+LVN[i][ar?1:0],info=lvInfo(id,i+1);
  if(st==="open"){const bt=Records.time(id,i),bts=bt?" · "+L2("best ","الأفضل ")+Math.floor(bt/60)+":"+String(bt%60).padStart(2,"0"):"";return row('data-l="'+(i+1)+'"',dn?"is-done":i===nextI?"is-next":"is-open",dn?"check":"play",nm,(cl[i]&&!b[i]?L2("passed by trial","اجتزته بالاختبار"):(info||(dn?L2("Replay to beat your best","أعد اللعب لتحسين نتيجتك"):L2("Ready to play","جاهز للعب"))))+bts,stars(b[i]))+
   (Progression.passageTrial(SR,PR,id,i)?row('data-t="pass" data-i="'+i+'"',"trial","sparkle",TR+": "+L2("pass level "+(i+1),"اجتز المستوى "+(i+1)),L2("Win a bonus game to mark this level passed (0★, no Ankh)","اربح لعبة إضافية لتجتاز هذا المستوى (0★ بدون عنخ)")):"")}
  if(st==="afford")return row('data-u="'+i+'"',"unlock","ankh",nm,L2("Tap to unlock for ","اضغط للفتح مقابل ")+ankh(cost)+" · "+L2("you have ","لديك ")+ankh(PR.tok),'<span class="lv-cost">'+ankh(cost)+'</span>');
  if(st==="short")return row("disabled","is-lock","lock",nm,L2("Needs ","يحتاج ")+ankh(cost)+" · "+L2("you have ","لديك ")+ankh(PR.tok)+" · "+L2("earn Ankh by beating your best stars","اربح العنخ بتحسين أفضل نجومك"),'<span class="lv-cost">'+ankh(cost)+'</span>')+
   (tt===i?row('data-t="tok" data-i="'+i+'"',"trial","sparkle",TR+": +"+ankh(1),L2("Win a bonus game · "+trLeft("tok")+" left at this place","اربح لعبة إضافية · متبقٍ "+trLeft("tok")+" هنا")):"");
  return row("disabled","is-lock","lock",nm,L2("Complete level "+i+" first","أكمل المستوى "+i+" أولًا"),'<span class="lv-cost">'+ankh(cost)+'</span>')}).join("");
 const st5=starSum(id);
 m.innerHTML='<div class="box lv-box"><div class="lv-head"><img src="'+placeArt(id)+'" alt="" decoding="async"><button id="lcl" class="lv-back" aria-label="'+L2("Close","إغلاق")+'">'+icon("back")+'</button><span class="lv-ankh">'+ankh(PR.tok)+" "+L2("Ankh","عنخ")+'</span>'+
 '<div class="lv-title"><span class="lv-kind">'+CH[id][ar?1:0]+'</span><h2>'+(ar?sel.ar:sel.en)+'</h2></div></div><div class="lv-body">'+
 '<div class="lv-prog"><span class="ico ico-star" aria-hidden="true"></span><span class="lv-prog-tx">'+st5+"/15 · "+L2("each new best star = 1 Ankh","كل نجمة أفضل جديدة = 1 عنخ")+'</span><i class="lv-bar"><b style="width:'+Math.round(100*st5/15)+'%"></b></i></div>'+
 '<p class="lvhead">'+placeGoalTxt(si)+'</p>'+rows+
 '<div class="lv-foot"><button class="bbtn lv-toggle'+(curseOn?" on":"")+'" id="cm" aria-pressed="'+curseOn+'"><span class="lv-sw" aria-hidden="true"></span><span class="lv-tx"><b>'+L2("Curse mode: ","وضع اللعنة: ")+(curseOn?L2("ON","مفعّل"):L2("OFF","متوقف"))+'</b><small>'+L2("Mistakes cost coins, but your reward is ×2","كل خطأ يخسّرك عملات، لكن مكافأتك ×2")+'</small></span></button>'+
 (Progression.endlessOpen(SR,PR,id)?row('data-l="'+((ENDL[id]||5)+1)+'"',"is-endless","infinity",L2("Endless","لا نهائي")+" · "+L2("Level ","المستوى ")+((ENDL[id]||5)+1),L2("Beat it to climb higher. It never ends!","اجتزه لتصعد أعلى. لا ينتهي أبدًا!")):"")+'</div></div></div>';
 m.style.display="flex";m.querySelectorAll("[data-l]").forEach(x=>x.onclick=()=>startSite(+x.dataset.l));
 m.querySelectorAll("[data-u]").forEach(x=>x.onclick=()=>{const r=Progression.unlockLevel(SR,PR,id,+x.dataset.u);if(r.ok){snd("ok");toastTx=L2("Level "+(+x.dataset.u+1)+" unlocked","فُتح المستوى "+(+x.dataset.u+1));toastT=performance.now()+1800}render();openLevels()});
 m.querySelectorAll("[data-t]").forEach(x=>x.onclick=()=>startTrial(x.dataset.t,id,+x.dataset.i));
 $("lcl").onclick=()=>{m.style.display="none"};$("cm").onclick=()=>{curseOn=!curseOn;render();openLevels()}}
function startSite(lv){runCombo=1;runComboN=0;{const d=sel||lastSite,i=d?SITES.indexOf(d):-1;/* central guard: locked place/level never starts */
 if(d&&!(unlocked(i)&&Progression.canStart(SR,PR,d.id,lv,ENDL[d.id]))){sel=d;if(unlocked(i))openLevels();return}}runSeq++;{const d=sel||lastSite;maxLives=Math.max(1,((d&&d.lives)||3)-(lv>=5?1:0));lives=maxLives;runLost=false;contUsed=false;pendingWin=0}if(!sel&&lastSite)sel=lastSite;if(!sel)return;lastSite=sel;runWon=false;curLevel=lv;curseRun=curseOn;curseLost=0;cur=WORLDS[sel.id];showIntro(()=>{$("bmenu").style.display="none";if(cur.makeArts)cur.arts=cur.makeArts();found=new Set();hintIdx=-1;fx=[];huntMiss=0;huntHints=0;lastFindT=performance.now();initView();if(cur.game)cur.game.start();runStart=performance.now();mode="world";document.body.classList.add("g");render()})}
function winGameCore(perf){perf=Math.max(1,Math.min(3,perf||1));const el=(performance.now()-runStart)/1000,par=parOf(sel.id),ts=el<=par?3:el<=par*1.6?2:1,stars=Math.max(1,Math.min(lives<maxLives?2:3,Math.round((perf+ts)/2)));lastLostHeart=lives<maxLives;const si=SITES.indexOf(sel),wasNext=si+1<SITES.length&&unlocked(si+1);lastTime=el;lastPar=par;lastPerf=perf;lastTs=ts;const id=sel.id,b=SR[id]||(SR[id]=[0,0,0,0,0]),li=curLevel-1,endless=curLevel>5;lastFirst=!done.has(id);
 const prev=endless?0:b[li],imp=endless?curLevel>(ENDL[id]||5):stars>prev;let p=Math.round((30+15*Math.min(curLevel,10))*stars*(imp?1:.25));if(lastFirst)p+=50;
 if(endless){if(imp)ENDL[id]=curLevel}else if(imp)b[li]=stars;lastPrev=prev;lastTok=endless?0:Progression.recordWin(PR,id,li,prev,stars);{const nw=Progression.refreshSites(SR,PR,SITES);if(nw.length)pendingReveal=nw[nw.length-1]}lastNewUnlock=!wasNext&&si+1<SITES.length&&unlocked(si+1);
 lastStars=stars;lastLvlUnlock=!endless&&li<4&&prev===0;done.add(id);lastDaily=claimDaily(id);p+=lastDaily;lastBoost=false;if(inv.boost>0){p=Math.round(p*1.5);inv.boost--;lastBoost=true}
 lastEvent=eventMult()>1;if(lastEvent)p*=2;lastCurse=curseRun;if(curseRun)p*=2;lastCombo=runCombo;lastComboN=runComboN;if(lastCombo>1)p*=lastCombo;if(stars===3)inv.hint++;qAdd("win",1);qAdd("star",stars);if(stars===3)qAdd("three",1);if(curLevel>=3)qAdd("hard",1);
 p=Math.max(1,Math.round(p*RATE));lastDaily=Math.round(lastDaily*RATE);lastWin=p;qAdd("coins",p);if(p>=40)qAdd("big",1);
 lastBestT=!endless&&Records.bestTime(id,li,el);Records.add({i:id,l:curLevel,c:p,t:Math.round(el),s:stars});score+=p;Ads.countFinish();try{celebrate(stars)}catch(e){showErr("celebration: "+e.message)}render();{const rs=runSeq;/* run-scoped: leaving the level before the dialog appears cancels it (it never pops up over the next screen) */
 setTimeout(()=>{if(rs!==runSeq)return;try{showDone()}catch(e){showErr("result: "+e.message);fallbackDone()}},1900)}}
function winGame(perf){if(runLost){pendingWin=perf||1;return}if(runWon||mode!=="world")return;if(!sel&&lastSite)sel=lastSite;if(!sel)return;runWon=true;lastSite=sel;try{winGameCore(perf)}catch(e){showErr("win: "+e.message);try{render()}catch(_){}const rs=runSeq;setTimeout(()=>{if(rs!==runSeq)return;try{showDone()}catch(_){fallbackDone()}},1200)}}
/* v4.6 phase 3: result dialog parts — big art (stars / broken heart / trophy), reward tiles, detail rows, one primary button */
const dIc=n=>'<span class="ico ico-'+n+'" aria-hidden="true"></span>';
const STAR_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2-4.6-4.4 6.3-.9z"/></svg>';
function doneArt(kind,n){const a=$("dart"),box=$("done").firstElementChild;if(!a)return;box.classList.toggle("is-win",kind==="stars"||kind==="trophy");box.classList.toggle("is-lose",kind==="lose");
 a.className="dart dart-"+kind;a.setAttribute("aria-label",kind==="stars"?n+"/3 ★":"");
 a.innerHTML=kind==="stars"?[0,1,2].map(i=>'<span class="dstar'+(i<n?" on":"")+'" style="animation-delay:'+(0.12+i*0.18).toFixed(2)+'s">'+STAR_SVG+'</span>').join(""):kind==="lose"?'<span class="dbig is-lose">'+dIc("heart")+'</span>':kind==="trophy"?'<span class="dbig">'+dIc("trophy")+'</span>':""}
function setDoneBtns(primary){["dnext","dre","dbtn"].forEach(id=>$(id).classList.toggle("is-primary",id===primary))}
const dRow=(icon,txt,cls)=>'<div class="drow'+(cls?" "+cls:"")+'">'+dIc(icon)+'<span class="drow-tx">'+txt+'</span></div>';
function dpAppend(icon,txt){const d=document.createElement("div");d.className="drow";d.innerHTML=dIc(icon)+'<span class="drow-tx"></span>';d.lastChild.textContent=txt;$("dp").appendChild(d)}
/* count the reward numbers up (skipped with reduced motion) */
function countUp(){if(motionReduced())return;$("dp").querySelectorAll(".dnum[data-to]").forEach(el=>{const to=+el.dataset.to,t0=performance.now();if(!(to>1))return;
 const step=t=>{const k=Math.min(1,(t-t0)/650),v=Math.round(to*(1-Math.pow(1-k,3)));el.textContent="+"+v;if(k<1&&el.isConnected)requestAnimationFrame(step)};el.textContent="+0";requestAnimationFrame(step)})}
function fallbackDone(){doneArt("stars",lastStars||1);$("dh").textContent=L2("Level complete!","اكتمل المستوى!");$("dp").textContent="";setRich($("dnext"),["@play"," "+L2("Next level","المستوى التالي")]);setRich($("dre"),["@retry"," "+L2("Retry","إعادة")]);setRich($("dbtn"),["@map"," "+L2("Back to map","العودة للخريطة")]);$("dnext").style.display=$("dre").style.display="block";$("dad").style.display="none";setDoneBtns("dnext");$("done").style.display="flex"}
function showDone(){doneMode="win";if(!sel&&lastSite)sel=lastSite;const t=T[lang],i=SITES.indexOf(lastSite||sel),nx=nextInfo();nextAct=nx.act;
 doneArt("stars",lastStars);$("dh").textContent=t.doneH;
 const tiles='<div class="dtiles"><div class="dtile is-coin"><span class="dtile-l">'+dIc("coin")+L2("Coins","العملات")+'</span><span class="dtile-v"><span class="dnum" data-to="'+lastWin+'">+'+lastWin+'</span> <small>'+L2("coins","عملة")+'</small></span></div>'+
  (curLevel<=5?'<div class="dtile is-ankh"><span class="dtile-l">'+dIc("ankh")+L2("Ankh","عنخ")+'</span><span class="dtile-v"><span class="dnum">+'+lastTok+'</span> <small>Ankh</small></span><span class="dtile-s">'+L2("balance ","الرصيد ")+PR.tok+'</span></div>':"")+'</div>';
 let rows=dRow("clock",Math.round(lastTime)+L2("s (par ","ث (الهدف ")+lastPar+L2("s) · speed ","ث) · السرعة ")+starTxt(lastTs)+" · "+L2("skill ","المهارة ")+starTxt(lastPerf));
 if(lastCombo>1)rows+=dRow("flame",L2("Combo ×"+lastCombo+" · "+lastComboN+" correct in a row","كومبو ×"+lastCombo+" · "+lastComboN+" إجابات صحيحة متتالية"),"is-best");
 if(lastBoost||lastEvent||lastCurse)rows+=dRow("bolt",[lastBoost?L2("Boost ×1.5","تعزيز ×1.5"):"",lastEvent?L2("Weekend ×2","عطلة ×2"):"",lastCurse?L2("Curse ×2","لعنة ×2"):""].filter(Boolean).join(" · "));
 if(lastBestT)rows+=dRow("clock",L2("New fastest time for this level!","أسرع وقت جديد لهذا المستوى!"),"is-best");
 if(lastDaily)rows+=dRow("star",L2("Daily bonus +"+lastDaily+" · streak "+streak,"مكافأة يومية +"+lastDaily+" · تتابع "+streak));
 if(lastStars===3)rows+=dRow("bulb",L2("Perfect! +1 free hint","ممتاز! +1 تلميح مجاني"));
 if(curLevel<=5&&!lastTok)rows+=dRow("ankh",L2("No new Ankh — beat your best ("+starTxt(lastPrev)+") to earn more","لا عنخ جديد — تفوّق على أفضل نتيجة ("+starTxt(lastPrev)+")"));
 if(lastCurse)rows+=dRow("skull",L2("Curse mode: lost "+curseLost+" coins","وضع اللعنة: خسرت "+curseLost+" عملة"));
 if(lastLostHeart&&lastStars<3)rows+=dRow("heart",L2("You lost a heart — ★★★ needs a flawless run","خسرت قلبًا — ★★★ تحتاج جولة بدون أخطاء"));
 let note="";if(lastNewUnlock)note=dRow("map",L2(SITES[i+1].en+" is now open!",SITES[i+1].ar+" مفتوح الآن!"),"dnote is-new");else if(i>=0&&i<SITES.length-1&&!unlocked(i+1))note=dRow("pyramid",(pointsMode()?L2("Next place — "+SITES[i+1].en+": ","المكان التالي — "+SITES[i+1].ar+": "):"")+lockText(i+1),"dnote");else if(i===SITES.length-1&&Progression.journeyDone(SR,PR,SITES))note=dRow("trophy",L2("Journey complete — you explored all of Egypt!","اكتملت الرحلة — استكشفت مصر كلها!"),"dnote is-new");
 if(nx.txt)note+=dRow("ankh",nx.txt.replace(/^☥\s*/,""),"dnote");
 $("dp").innerHTML=tiles+'<div class="drows">'+rows+'</div>'+note;countUp();
 setRich($("dnext"),["@play"," "+(nx.label||"").replace(/^▶\s*/,"")]);setRich($("dre"),["@retry"," "+L2("Retry this level","أعد هذا المستوى")]);$("dre").style.display="block";$("dnext").style.display=nx.act==="none"?"none":"block";
 setRich($("dbtn"),lastNewUnlock?["@map"," "+L2("New place unlocked ▶","فُتح مكان جديد ▶")]:["@map"," "+L2("Back to map","العودة للخريطة")]);
 setDoneBtns(lastNewUnlock||nx.act==="none"?"dbtn":"dnext");offerDouble();$("done").style.display="flex"}
/* What "next" does after a win: play the next level, unlock it with Ankh and play, or open the level list. */
function nextInfo(){const id=(lastSite||sel).id,li=curLevel;
 if(curLevel>=5)return Progression.endlessOpen(SR,PR,id)?{act:"play",label:"▶ "+L2("Endless ("+(curLevel+1)+")","لا نهائي ("+(curLevel+1)+")")}:{act:"none"};
 const st=Progression.levelStatus(SR,PR,id,li),c=Progression.levelCost(li);
 if(st==="open")return{act:"play",label:"▶ "+L2("Next level ("+(li+1)+")","المستوى التالي ("+(li+1)+")")};
 if(st==="afford")return{act:"unlock",label:"▶ "+L2("Unlock & play level "+(li+1)+" (−"+c+" Ankh)","افتح والعب المستوى "+(li+1)+" (−"+c+" عنخ)")};
 return{act:"list",label:"▶ "+L2("Levels","المستويات"),txt:"☥ "+L2("Level "+(li+1)+" needs "+c+" Ankh (you have "+PR.tok+")","المستوى "+(li+1)+" يحتاج "+c+" عنخ (لديك "+PR.tok+")")}}
/* Leaving the result dialog is the natural ad break (never mid-level). */
const doneGo=fn=>{$("done").style.display="none";Ads.breakThen(fn)};
$("dnext").onclick=()=>{const d=lastSite||sel,act=nextAct;
 if(doneMode==="lose"){doneGo(()=>startTrial("pass",d.id,curLevel-1));return}
 doneGo(()=>{if(act==="list"){exitWorld();sel=d;openLevels();return}if(act==="unlock")Progression.unlockLevel(SR,PR,d.id,curLevel);startSite(curLevel+1)})};
$("dre").onclick=()=>doneGo(()=>doneMode==="bonusLose"?startBonus(bonusKey,trial):startSite(curLevel));
$("dbtn").onclick=()=>doneGo(()=>{if(bonusMode||doneMode!=="win"){const tb=trialBack;exitWorld();if(tb){trialBack=null;sel=SITES.find(s=>s.id===tb)||sel;if(sel)openLevels()}return}const i=SITES.indexOf(lastSite||sel);exitWorld();if(lastNewUnlock&&i>=0&&i<SITES.length-1)select(SITES[i+1].id)});
/* Optional rewarded ad: double the points of the run you just finished */
function offerDouble(){const b=$("dad"),on=Ads.canReward()&&lastWin>0;b.style.display=on?"block":"none";b.disabled=false;b.textContent="🎬 "+L2("Watch an ad: double to +"+lastWin*2,"شاهد إعلانًا: ضاعف إلى +"+lastWin*2)}
$("dad").onclick=async()=>{const b=$("dad");if(doneMode==="lose"){continueRun();return}b.disabled=true;const won=lastWin;const ok=await Ads.rewarded("double_points");
 if(ok){score+=won;lastWin=0;b.style.display="none";dpAppend("video",L2("Doubled! +"+won+" more coins","تمت المضاعفة! +"+won+" عملة إضافية"));snd("win");confetti();render()}
 else{b.disabled=false;toastTx=L2("No ad available right now","لا يوجد إعلان متاح الآن");toastT=performance.now()+2000}};

/* ---------- LOSING ---------- */
/* A mistake: called automatically for snd("bad") during a place run (see audio.js). */
function hurt(){if(runWon||runLost||mode!=="world"||!cur||cur.bonus)return;lives--;hurtT=performance.now();if(vibOn&&navigator.vibrate)try{navigator.vibrate([40,40,80])}catch(e){}
 if(lives<=0)loseGame(L2("You ran out of hearts.","نفدت قلوبك."))}
/* End the run as a loss (games may also call this directly, e.g. out of moves). */
function loseGame(reason){if(runWon||runLost||mode!=="world")return;runLost=true;if(sel&&!cur.bonus&&curLevel<=5)Progression.recordLoss(PR,sel.id,curLevel-1);runWon=true;loseT=performance.now();lives=Math.max(0,lives);Ads.countFinish();
 snd("lose");render();later(()=>showLose(reason),900)}
const LOSE_TIPS=[["Slow down — accuracy beats speed.","هدّي — الدقة أهم من السرعة."],["Read the ℹ️ help before you start.","اقرأ تعليمات ℹ️ قبل البدء."],["Every mistake costs a heart.","كل خطأ يكلّفك قلبًا."]];
function showLose(reason){doneMode="lose";const tip=LOSE_TIPS[Math.floor(Math.random()*LOSE_TIPS.length)];
 doneArt("lose");$("dh").textContent=L2("Level failed","خسرت المستوى");
 $("dp").innerHTML='<div class="drows">'+(reason?dRow("heart",reason):"")+dRow("coin",L2("No coins this time.","لا عملات هذه المرة."))+dRow("bulb",tip[lang==="ar"?1:0])+(curseRun&&curseLost?dRow("skull",L2("Curse mode: lost "+curseLost+" coins","وضع اللعنة: خسرت "+curseLost+" عملة")):"")+'</div>';
 $("dnext").style.display="none";$("dre").style.display="block";setRich($("dre"),["@retry"," "+L2("Try again","حاول مرة أخرى")]);setRich($("dbtn"),["@map"," "+L2("Back to map","العودة للخريطة")]);setDoneBtns("dre");
 if(sel&&Progression.passageTrial(SR,PR,sel.id,curLevel-1)){$("dnext").style.display="block";setRich($("dnext"),["@sparkle"," "+L2("Scribe's Trial: pass this level","اختبار الكاتب: اجتز هذا المستوى")]);$("dp").insertAdjacentHTML("beforeend",dRow("sparkle",L2("Stuck? Win a bonus game to pass this level (0★, no Ankh). Once per place.","عالق؟ اربح لعبة إضافية لتجتاز هذا المستوى (0★ بدون عنخ). مرة واحدة لكل مكان."),"dnote"))}
 const b=$("dad"),can=!contUsed&&Ads.canReward();b.style.display=can?"block":"none";b.disabled=false;b.textContent="🎬 "+L2("Watch an ad: +1 ♥ and continue","شاهد إعلانًا: +1 ♥ وأكمل");$("done").style.display="flex"}
async function continueRun(){const b=$("dad");b.disabled=true;const ok=await Ads.rewarded("continue");
 if(!ok){b.disabled=false;toastTx=L2("No ad available right now","لا يوجد إعلان متاح الآن");toastT=performance.now()+2000;return}
 contUsed=true;if(sel&&curLevel<=5)Progression.undoLoss(PR,sel.id,curLevel-1);lives=1;runLost=false;runWon=false;runStart+=performance.now()-loseT;$("done").style.display="none";render();
 if(pendingWin){const p=pendingWin;pendingWin=0;winGame(p)}}
