/* ============================================================
   Ads layer — one API, three providers:
     "admob" : Android app (Capacitor + @capacitor-community/admob)
     "h5"    : browser (Google H5 Games Ads / AdSense for games)
     "mock"  : DEVELOPMENT ONLY — a placeholder overlay to check layouts. It is used only when
               ADS.test is true AND the page runs on localhost/127.0.0.1 AND the URL has ?devads=1.
               It can never run in a release build, on a real website or inside the Android app.
   The game only calls:
     Ads.update()               – show/hide the map banner (called from render)
     Ads.countFinish()          – a level or bonus game ended
     Ads.breakThen(fn)          – maybe show an interstitial, then run fn
     Ads.canReward()            – is a rewarded ad possible right now?
     Ads.rewarded(name)         – Promise<boolean>: true if the player earned the reward
   Rules: never during gameplay, banner only on the map, interstitials capped by ADS config.
   ============================================================ */
/* No ad provider = no rewarded buttons are shown and no reward can be granted. */
const devMockAllowed=()=>{try{return ADS.test===true&&/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)&&new URLSearchParams(location.search).has("devads")}catch(e){return false}};
let adH=0; // px reserved at the bottom of the map for the banner (read by map.js / CSS --ad-h)
const Ads=(()=>{
 const TEST_IDS={banner:"ca-app-pub-3940256099942544/9214589741",interstitial:"ca-app-pub-3940256099942544/1033173712",rewarded:"ca-app-pub-3940256099942544/5224354917"};
 const isNative=()=>!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
 const plug=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AdMob;
 const id=k=>ADS.test?TEST_IDS[k]:ADS.native[k];
 let provider="none",ready=false,busy=false,since=0,lastShown=0,bannerWanted=false,bannerShown=false,interReady=false,rewardReady=false;
 const bootT=Date.now();

 function setAdH(h){adH=Math.max(0,Math.round(h||0));document.documentElement.style.setProperty("--ad-h",adH+"px")}
 function pauseAudio(){try{AC&&AC.suspend()}catch(e){}}
 function resumeAudio(){try{AC&&!muted&&AC.resume()}catch(e){}}

 /* ---------- providers ---------- */
 const admob={
  async init(){const A=plug();
   await A.initialize({initializeForTesting:ADS.test,tagForChildDirectedTreatment:ADS.childDirected,tagForUnderAgeOfConsent:ADS.childDirected});
   try{const ci=await A.requestConsentInfo();if(ci&&ci.isConsentFormAvailable&&ci.status==="REQUIRED")await A.showConsentForm()}catch(e){}
   A.addListener("bannerAdSizeChanged",s=>{if(bannerShown)setAdH(s&&s.height)});
   A.addListener("interstitialAdDismissed",()=>{interReady=false;admob.prepInter()});
   admob.prepInter();admob.prepReward()},
  async prepInter(){try{await plug().prepareInterstitial({adId:id("interstitial"),isTesting:ADS.test});interReady=true}catch(e){interReady=false}},
  async prepReward(){try{await plug().prepareRewardVideoAd({adId:id("rewarded"),isTesting:ADS.test});rewardReady=true}catch(e){rewardReady=false}},
  async banner(on){const A=plug();try{if(on){if(!bannerShown){await A.showBanner({adId:id("banner"),adSize:"ADAPTIVE_BANNER",position:"BOTTOM_CENTER",margin:0,isTesting:ADS.test});bannerShown=true;if(!adH)setAdH(56)}else await A.resumeBanner()}else if(bannerShown){await A.hideBanner();setAdH(0);bannerShown=false;await A.removeBanner().catch(()=>{})}}catch(e){bannerShown=false;setAdH(0)}},
  async inter(){if(!interReady){admob.prepInter();return false}try{await plug().showInterstitial();return true}catch(e){return false}finally{interReady=false}},
  /* Resolves when the ad closes. Reward only if the SDK reported it (event or resolved reward item). */
  async reward(){if(!rewardReady){admob.prepReward();return false}rewardReady=false;const A=plug(),hs=[];let got=false,fin=null;
   const done=new Promise(r=>{fin=r});
   hs.push(await A.addListener("onRewardedVideoAdReward",()=>{got=true}));
   hs.push(await A.addListener("onRewardedVideoAdDismissed",()=>setTimeout(()=>fin(),350)));
   hs.push(await A.addListener("onRewardedVideoAdFailedToShow",()=>fin()));
   A.showRewardVideoAd().then(r=>{if(r&&r.type!=null)got=true}).catch(()=>fin());
   const guard=setTimeout(()=>fin(),120000);await done;clearTimeout(guard);
   hs.forEach(h=>{try{h&&h.remove&&h.remove()}catch(e){}});admob.prepReward();return got}
 };
 const h5={
  init(){const s=document.createElement("script");s.async=true;s.crossOrigin="anonymous";
   s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(ADS.web.client);
   s.setAttribute("data-ad-client",ADS.web.client);s.setAttribute("data-ad-frequency-hint",ADS.interstitialMinGapSec+"s");if(ADS.test)s.setAttribute("data-adbreak-test","on");
   if(ADS.childDirected)s.setAttribute("data-tag-for-child-directed-treatment","1");
   document.head.appendChild(s);window.adsbygoogle=window.adsbygoogle||[];
   window.adBreak=window.adConfig=function(o){window.adsbygoogle.push(o)};
   adConfig({preloadAdBreaks:"on",sound:"on",onReady:()=>{rewardReady=true}})},
  banner(on){const el=$("adbanner");if(!ADS.web.bannerSlot)return;
   if(on&&!bannerShown){el.innerHTML='<ins class="adsbygoogle" style="display:inline-block;width:320px;height:50px" data-ad-client="'+ADS.web.client+'" data-ad-slot="'+ADS.web.bannerSlot+'"></ins>';el.style.display="flex";setAdH(54);try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}bannerShown=true}
   else if(!on&&bannerShown){el.style.display="none";el.innerHTML="";setAdH(0);bannerShown=false}},
  inter(){return new Promise(res=>{let shown=false;adBreak({type:"next",name:"level-end",beforeAd:()=>{shown=true;pauseAudio()},afterAd:resumeAudio,adBreakDone:()=>res(shown)})})},
  reward(name){return new Promise(res=>{let got=false;adBreak({type:"reward",name:name||"reward",
   beforeAd:pauseAudio,afterAd:resumeAudio,beforeReward:show=>show(),adViewed:()=>{got=true},adDismissed:()=>{got=false},
   adBreakDone:()=>res(got)})})}
 };
 const mock={
  init(){rewardReady=true},
  banner(on){const el=$("adbanner");if(on&&!bannerShown){el.innerHTML='<div style="width:320px;height:50px;border:1px dashed #556;color:#889;font:12px system-ui;display:flex;align-items:center;justify-content:center">DEV placeholder banner (not a real ad)</div>';el.style.display="flex";setAdH(54);bannerShown=true}
   else if(!on&&bannerShown){el.style.display="none";el.innerHTML="";setAdH(0);bannerShown=false}},
  show(kind,secs){return new Promise(res=>{const o=$("adov");pauseAudio();let left=secs,done=false;
   o.innerHTML='<div class="box"><b style="color:var(--gold)">'+(kind==="reward"?L2("DEV placeholder — rewarded ad (not a real ad)","تجربة مطوّر — إعلان بمكافأة (ليس إعلانًا حقيقيًا)"):L2("DEV placeholder — ad (not a real ad)","تجربة مطوّر — إعلان (ليس إعلانًا حقيقيًا)"))+'</b><div class="bar"><i id="adpb"></i></div><button class="bbtn" id="adx" style="text-align:center"></button></div>';
   o.style.display="flex";const btn=$("adx"),pb=$("adpb");
   const fin=ok=>{if(done)return;done=true;clearInterval(iv);o.style.display="none";resumeAudio();res(ok)};
   const tick=()=>{pb.style.width=(100*(secs-left)/secs)+"%";btn.textContent=left>0?(kind==="reward"?L2("Close (no reward)","إغلاق (بدون مكافأة)"):L2("Skip in ","تخطي بعد ")+left+"s"):L2("Close","إغلاق");btn.disabled=kind!=="reward"&&left>0};
   const iv=setInterval(()=>{left--;tick();if(left<=0)clearInterval(iv)},1000);tick();
   btn.onclick=()=>fin(kind==="reward"?left<=0:true)})},
  inter(){return mock.show("inter",3)},reward(){return mock.show("reward",3)}
 };
 const P={admob,h5,mock};

 return{
  get provider(){return provider},
  async init(){if(!ADS.enabled)return;
   try{if(isNative()){if(!plug())return;provider="admob"}else if(ADS.web.client){provider="h5"}else if(devMockAllowed()){provider="mock";console.warn("Ads: DEV placeholder ads (?devads=1) — not real ads, local testing only")}else return;
    await P[provider].init();ready=true;Ads.update()}catch(e){console.warn("ads init failed",e);provider="none"}},
  update(){bannerWanted=ready&&mode==="map";if(!ready||busy)return;if(bannerWanted!==bannerShown)P[provider].banner(bannerWanted)},
  countFinish(){since++},
  eligible(){const now=Date.now();return ready&&since>=ADS.interstitialEvery&&now-lastShown>=ADS.interstitialMinGapSec*1000&&now-bootT>=ADS.firstInterstitialAfterSec*1000},
  async breakThen(fn){if(!this.eligible()||busy){fn&&fn();return}busy=true;
   try{const shown=await P[provider].inter();if(shown){since=0;lastShown=Date.now()}}catch(e){}busy=false;fn&&fn();Ads.update()},
  canReward(){return ready&&!busy&&(provider==="mock"||provider==="h5"||rewardReady)},
  async rewarded(name){if(!this.canReward())return false;busy=true;const t0=performance.now();let ok=false;
   try{ok=!!(await P[provider].reward(name))}catch(e){}busy=false;
   if(mode==="world"&&!runWon)runStart+=performance.now()-t0; // don't let the ad eat the speed bonus
   lastShown=Date.now();since=0;Ads.update();return ok}
 }})();
