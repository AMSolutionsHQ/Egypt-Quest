/* ============================================================
   Egypt Quest — global configuration
   Edit this file to tune the game, the place order and ads.
   ============================================================ */
const VERSION="5.1.0";

/* Order of places on the map. Unlock cost grows with position
   (see need() in core/state.js) unless a place sets `req`.
   Each id must match a file in /games that calls definePlace({id:...}). */
const SITE_ORDER=["gem","giza","alex","luxor","philae","abu","siwa","edfu","sinai","redsea","abydos","whitedesert","hitan","matruh","kharga","gouna"];

/* ---------- Progression (see js/core/progression.js) ----------
   levelCost        : Ankh tokens to unlock levels 1..5 (level 1 is free)
   placeUnlock      : "points" = places are bought with points in map order (placeCostStep × position,
                      e.g. Giza 100 … El Gouna 1500; a place may set unlockCost) · "progress" = rule below
   placeRule        : (progress mode) rule to open the NEXT place: complete `levels` first levels
                      and earn `stars` (best per level, summed) here. A place file may
                      override it with definePlace({... unlock:{levels,stars}}).
   tokenTrialMax    : Scribe's Token Trials (+1 Ankh) per place
   passageTrialMax  : Scribe's Passage Trials (pass a level at 0★) per place
   passageAfterFails: losses in a row on one level before the Passage Trial is offered */
const PROGRESSION={levelCost:[0,1,2,3,3],placeUnlock:"points",placeCostStep:100,placeRule:{levels:3,stars:6},tokenTrialMax:2,passageTrialMax:1,passageAfterFails:3};

/* ---------- Ads ----------
   enabled   : master switch (set false to ship an ad-free build)
   test      : true = use Google test ad units / H5 test mode. MUST be false for release.
               (Placeholder "dev" ads exist only on localhost with ?devads=1 — see js/ads.js.
               Without a real provider, no rewarded buttons are shown and no ad reward is ever granted.)
   native    : AdMob ids used inside the Android app (Capacitor)
   web       : Google H5 Games Ads (AdSense for games) used in the browser
   Frequency caps keep ads friendly: no ads during play, only between levels. */
const ADS={
 enabled:true,
 test:true,
 childDirected:false,          // set true if you target children (Google Families policy)
 interstitialEvery:3,          // show an interstitial after every N finished levels/bonus games
 interstitialMinGapSec:120,    // …and never more often than this
 firstInterstitialAfterSec:180,// grace period after app start
 rewardedHints:3,              // hints granted by a rewarded video
 native:{
  appId:"ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy",          // also goes in AndroidManifest.xml
  banner:"ca-app-pub-xxxxxxxxxxxxxxxx/1111111111",
  interstitial:"ca-app-pub-xxxxxxxxxxxxxxxx/2222222222",
  rewarded:"ca-app-pub-xxxxxxxxxxxxxxxx/3333333333"
 },
 web:{
  client:"",                   // "ca-pub-xxxxxxxxxxxxxxxx" — leave empty to disable web ads
  bannerSlot:""                // AdSense display slot id for the map banner (optional)
 }
};
