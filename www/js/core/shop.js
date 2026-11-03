const ITEMS=[
{id:"hint5",icon:"💡",en:"5 Hints",ar:"5 تلميحات",d:["Use them in the artifact hunt and the Philae puzzle","استخدمها في البحث عن القطع ولغز فيلة"],cost:50,buy:()=>{inv.hint+=5},stock:()=>inv.hint},
{id:"time",icon:"⏱️",en:"+10 seconds ×3",ar:"+10 ثوانٍ ×3",d:["Extra time in Scarab Rush and Treasure Catch","وقت إضافي في الجعارين وصيد الكنوز"],cost:60,buy:()=>{inv.time+=3},stock:()=>inv.time},
{id:"boost",icon:"⚡",en:"Coins ×1.5 (3 wins)",ar:"عملات ×1.5 (3 انتصارات)",d:["Boosts the reward of your next 3 site wins","يزيد مكافأة أول 3 انتصارات"],cost:120,buy:()=>{inv.boost+=3},stock:()=>inv.boost},
{id:"freeze",icon:"🧊",en:"Streak freeze",ar:"حماية التتابع",d:["Saves your streak if you miss one day","تحمي تتابعك إذا فاتك يوم واحد"],cost:80,buy:()=>{inv.freeze++},stock:()=>inv.freeze},
{id:"ward",icon:"🛡️",en:"Curse ward ×5",ar:"درع اللعنة ×5",d:["Blocks the next 5 coin losses (curse mode, cursed scarabs, missed days)","يصدّ أول 5 خسائر للعملات (وضع اللعنة، الجعارين الملعونة، الغياب)"],cost:90,buy:()=>{inv.ward+=5},stock:()=>inv.ward},
{id:"sunset",icon:"🌅",en:"Sunset map",ar:"خريطة الغروب",d:["A warm purple-orange map style","شكل خريطة بألوان الغروب"],cost:150,once:true,buy:()=>{own.add("sunset");theme=themeMode="sunset"}},
{id:"night",icon:"🌙",en:"Night map",ar:"خريطة الليل",d:["A dark, starry-blue map style","شكل خريطة ليلي"],cost:250,once:true,buy:()=>{own.add("night");theme=themeMode="night"}},
{id:"lucky",icon:"🍀",en:"Lucky scarab",ar:"الجعران المحظوظ",d:["Golden scarabs appear twice as often on the map","الجعارين الذهبية تظهر ضعف المرات على الخريطة"],cost:300,once:true,buy:()=>{own.add("lucky")}}];
let shopTab="boost";
const SHOP_ICON={hint5:"bulb",time:"clock",boost:"bolt",freeze:"snowflake",ward:"shield",sunset:"sparkle",night:"moon",lucky:"scarab"},SHOP_TONE={time:"nile",freeze:"nile",ward:"faience",lucky:"gold",night:"nile"};
const THEME_SW={auto:"linear-gradient(135deg,#E6C487 0 33%,#E0835A 33% 66%,#24345E 66%)",classic:"linear-gradient(180deg,#1B6CA8,#E6C487)",sunset:"linear-gradient(180deg,#3B2A6B,#F3B36B)",night:"linear-gradient(180deg,#050D1C,#46486A)"};
/* Charms: marker frames — bought once with coins, then equipped (one at a time) */
function charms(){const ar=lang==="ar";return'<p class="sh-sub2">'+L2("Frame colour for the places on your map.","لون إطار الأماكن على خريطتك.")+'</p><div class="sgrid">'+Object.keys(FRAMES).map(k=>{const f=FRAMES[k],have=k==="gold"||own.has("frame_"+k),on=frame===k;
 return'<div class="scard'+(on?" is-own":"")+'"><div class="scard-top"><span class="frame-sw" style="--fc:'+f.c+'">'+icn("pyramid")+'</span>'+(on?'<span class="scard-have">'+L2("Equipped","مستخدم")+'</span>':"")+'</div><b>'+L2(f.en+" frame","إطار "+f.ar)+'</b>'+
  (on?'<span class="scard-owned">'+icn("check")+L2("Equipped","مستخدم")+'</span>':have?'<button class="scard-buy is-equip" data-feq="'+k+'">'+L2("Use","استخدم")+'</button>':'<button class="scard-buy" data-fbuy="'+k+'"'+(bal()>=f.cost?"":" disabled")+' aria-label="'+L2("Buy for ","اشترِ مقابل ")+f.cost+'">'+icn("coin")+f.cost+'</button>')+'</div>'}).join("")+'</div>'}
function openShop(){const ar=lang==="ar",m=$("bmenu");
 /* v4.6 phase 4: bazaar — tabs (Boosts / Map styles) and a 2-column card grid */
 const card=it=>{const ow=it.once&&own.has(it.id),can=!ow&&bal()>=it.cost;return'<div class="scard'+(ow?" is-own":"")+'"><div class="scard-top"><span class="scard-ic tone-'+(SHOP_TONE[it.id]||"gold")+'">'+icn(SHOP_ICON[it.id]||"gift")+'</span>'+
  (it.stock?'<span class="scard-have">'+L2("you have ","لديك ")+it.stock()+'</span>':"")+'</div><b>'+(ar?it.ar:it.en)+'</b><small>'+it.d[ar?1:0]+'</small>'+
  (ow?'<span class="scard-owned">'+icn("check")+L2("Owned","مملوك")+'</span>':'<button class="scard-buy" data-i="'+it.id+'"'+(can?"":" disabled")+' aria-label="'+L2("Buy for ","اشترِ مقابل ")+it.cost+'">'+icn("coin")+it.cost+'</button>')+'</div>'};
 const styles=["sunset","night"],grid=items=>'<div class="sgrid">'+items.map(card).join("")+'</div>';
 const thb=(k,label)=>'<button class="theme-sw'+(themeMode===k?" on":"")+'" data-th="'+k+'" aria-pressed="'+(themeMode===k)+'" style="background:'+THEME_SW[k]+'"><span>'+label+'</span></button>';
 const lc=Daylight.where().src,th='<div class="theme-row">'+thb("auto",L2("Auto","تلقائي"))+["classic","sunset","night"].filter(k=>k==="classic"||own.has(k)).map(k=>thb(k,THN_SHORT[k][ar?1:0])).join("")+'</div>'+
  '<p class="theme-note">'+L2("Auto follows the sun where you are: sunny by day, sunset glow at sunrise & sunset, night after dark. Now: ","التلقائي يتبع الشمس في مكانك: مشمس نهارًا، ألوان الغروب وقت الشروق والغروب، ليل بعد المغرب. الآن: ")+THN[Daylight.phase()][ar?1:0]+" · "+
  (lc==="gps"?L2("precise location","موقع دقيق"):lc==="ip"?L2("approximate location","موقع تقريبي"):L2("Cairo time (location unknown)","توقيت القاهرة (الموقع غير معروف)"))+'</p>'+
  (lc!=="gps"&&navigator.geolocation?'<button class="bbtn mini" id="shloc">'+icn("globe")+" "+L2("Use my device location for Auto","استخدم موقع جهازي للوضع التلقائي")+'</button>':"");
 const tab=(k,label)=>'<button class="stab'+(shopTab===k?" on":"")+'" data-tab="'+k+'" role="tab" aria-selected="'+(shopTab===k)+'">'+label+'</button>';
 m.innerHTML='<div class="box sheet shop-box">'+menuHead("bag",L2("Shop","المتجر"),"shc",coinChip(bal()))+
  '<div class="stabs" role="tablist">'+tab("boost",L2("Boosts","معززات"))+tab("styles",L2("Map styles","أشكال الخريطة"))+tab("charms",L2("Charms","زينة"))+'</div>'+(shopTab==="charms"?charms():
  (shopTab==="boost"?(Ads.canReward()?'<button class="bbtn ad" id="shad"><b>'+icn("video")+" "+L2("Free: +"+ADS.rewardedHints+" hints","مجانًا: +"+ADS.rewardedHints+" تلميحات")+'</b><small>'+L2("Watch a short ad","شاهد إعلانًا قصيرًا")+'</small></button>':"")+grid(ITEMS.filter(i=>!styles.includes(i.id))):
   '<h3 class="sh-sub">'+L2("Map style","شكل الخريطة")+'</h3>'+th+grid(ITEMS.filter(i=>styles.includes(i.id)))))+
  '<p class="sh-foot">'+L2("Prices are in coins you earn by playing. No real money.","الأسعار بالعملات التي تربحها باللعب. بدون أموال حقيقية.")+' · '+L2("Stars: ","النجوم: ")+totalStars()+'</p></div>';
 m.querySelectorAll("[data-tab]").forEach(x=>x.onclick=()=>{shopTab=x.dataset.tab;openShop()});
 m.querySelectorAll("[data-feq]").forEach(x=>x.onclick=()=>{frame=x.dataset.feq;snd("tap");render();openShop()});
 m.querySelectorAll("[data-fbuy]").forEach(x=>x.onclick=()=>{const k=x.dataset.fbuy,f=FRAMES[k];if(!f||own.has("frame_"+k)||bal()<f.cost)return;spent+=f.cost;own.add("frame_"+k);frame=k;snd("ok");render();openShop()});
 m.style.display="flex";$("shc").onclick=()=>{m.style.display="none"};if($("shad"))$("shad").onclick=()=>adForHints(openShop);
 m.querySelectorAll("[data-i]").forEach(x=>x.onclick=()=>{const it=ITEMS.find(i=>i.id===x.dataset.i);if(!it||bal()<it.cost||(it.once&&own.has(it.id)))return;spent+=it.cost;it.buy();snd("ok");render();openShop()});
 m.querySelectorAll("[data-th]").forEach(x=>x.onclick=()=>{themeMode=x.dataset.th;if(themeMode==="auto")applyAutoTheme();else theme=themeMode;render();openShop()});
 if($("shloc"))$("shloc").onclick=async()=>{const ok=await Daylight.askPrecise();toastTx=ok?L2("Location set — Auto map style updated","تم تحديد الموقع — تم تحديث شكل الخريطة"):L2("Location not available — using approximate time","الموقع غير متاح — نستخدم توقيتًا تقريبيًا");toastT=performance.now()+2500;applyAutoTheme();render();if($("bmenu").style.display==="flex")openShop()}}
