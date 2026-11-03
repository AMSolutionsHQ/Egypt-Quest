/* ============================================================
   Boot: build the place registry, restore the save, start the loop.
   Loaded last — every other script must already be on the page.
   ============================================================ */
let lastS="";
buildSites();
load();touchDay();newQuestDay();render();if(loginPending)openLogin();scheduleReminders();
document.addEventListener("visibilitychange",()=>{if(document.hidden){save();try{AC&&AC.suspend()}catch(e){}}else{touchDay();newQuestDay();render();if(loginPending)openLogin()}});
addEventListener("pagehide",save);

/* Deep links:  index.html?game=<placeId>   or   index.html?bonus=<rush|quiz|catch>
   A locked place is only selected on the map (no skipping the unlock). */
(function deepLink(){const q=new URLSearchParams(location.search),g=q.get("game"),b=q.get("bonus");
 if(g){const i=SITES.findIndex(s=>s.id===g);if(i>=0){$("bmenu").style.display="none";select(g);if(unlocked(i))startSite(1)}}
 else if(b&&BONUS[b]){$("bmenu").style.display="none";startBonus(b)}})();

startDaylight();  // map style follows the real sun (auto mode)
Ads.init();
QGen.warm();   // prefetch fresh quiz data in the background
App.init();

let loopT=0,playAcc=0; // play time for the "Play for 10 minutes" mission
(function loop(){const t=performance.now();requestAnimationFrame(loop);
 if(mode==="world"&&!document.hidden){playAcc+=Math.min(200,t-(loopT||t));if(playAcc>=5000){playAcc-=5000;qAdd("time",5,true)}}loopT=t;
 if(mode==="map"){updGS(t);drawMap(t);drawGS(t)}else if(cur.game){cur.game.draw(t);const st=(cur.bonus?"":hearts()+" · ")+cur.game.status()+(cur.bonus||runWon?"":" · "+Math.floor((performance.now()-runStart)/1000)+"s");if(st!==lastS){$("tray").textContent=st;lastS=st}}else{drawWorld(t);const st=hearts()+" · "+L2("Found ","وُجد ")+found.size+"/"+cur.arts.length+(cur.arts.length-found.size===1?" · "+L2("1 left!","واحدة متبقية!"):"")+(runWon?"":" · "+Math.floor((performance.now()-runStart)/1000)+"s");if(st!==lastS){$("tray").textContent=st;lastS=st}}drawFx(t);drawCeleb(t);if(chestEl&&mode==="map"){const x=chestShort();if(chestEl.textContent!==x)chestEl.textContent=x;chestEl.parentNode.classList.toggle("ready",chestAt<=Date.now())}})(0);
