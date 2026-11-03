/* ============================================================
   Settings screen (v4.6 redesign phase 5) — opened from the gear in the map HUD.
   Sound, vibration, reduce motion, language, map style, backup and reset.
   Every option uses the same state and functions as before (muted/updMute,
   lang, themeMode/applyAutoTheme, openBackup, resetProgress).
   ============================================================ */
function openSettings(){const ar=lang==="ar",m=$("bmenu");
 const tg=(k,ic,label,on,sub)=>'<button class="bbtn lv-toggle st-row'+(on?" on":"")+'" data-set="'+k+'" aria-pressed="'+on+'">'+icn(ic)+'<span class="lv-tx"><b>'+label+'</b>'+(sub?'<small>'+sub+'</small>':"")+'</span><span class="lv-sw" aria-hidden="true"></span></button>';
 const thb=(k,label)=>'<button class="theme-sw'+(themeMode===k?" on":"")+'" data-th="'+k+'" aria-pressed="'+(themeMode===k)+'" style="background:'+THEME_SW[k]+'"><span>'+label+'</span></button>';
 const lc=Daylight.where().src;
 m.innerHTML='<div class="box sheet settings-box">'+menuHead("gear",L2("Settings","الإعدادات"),"stc")+
  '<div class="st-group">'+tg("sound","speaker",L2("Sound","الصوت"),!muted)+tg("vib","bolt",L2("Vibration","الاهتزاز"),vibOn,L2("Short buzz when you lose a heart","اهتزاز قصير عند خسارة قلب"))+tg("motion","sparkle",L2("Reduce motion","تقليل الحركة"),motionOff,L2("Fewer animations and effects","رسوم متحركة ومؤثرات أقل"))+'</div>'+
  '<h3 class="sh-sub">'+icn("globe")+L2("Language","اللغة")+'</h3><div class="stabs">'+
   '<button class="stab'+(lang==="en"?" on":"")+'" data-lang="en" aria-pressed="'+(lang==="en")+'">English</button><button class="stab'+(lang==="ar"?" on":"")+'" data-lang="ar" aria-pressed="'+(lang==="ar")+'" lang="ar">العربية</button></div>'+
  '<h3 class="sh-sub">'+icn("sparkle")+L2("Map style","شكل الخريطة")+' <span>'+L2("Now: ","الآن: ")+THN[themeMode==="auto"?Daylight.phase():theme][ar?1:0]+'</span></h3><div class="theme-row">'+thb("auto",L2("Auto","تلقائي"))+["classic","sunset","night"].filter(k=>k==="classic"||own.has(k)).map(k=>thb(k,THN_SHORT[k][ar?1:0])).join("")+'</div>'+
  (lc!=="gps"&&navigator.geolocation?'<button class="bbtn mini" id="stloc">'+icn("globe")+" "+L2("Use my device location for Auto","استخدم موقع جهازي للوضع التلقائي")+'</button>':"")+
  (own.has("sunset")&&own.has("night")?"":'<p class="theme-note">'+L2("More styles in the Shop.","أشكال أكثر في المتجر.")+'</p>')+
  '<h3 class="sh-sub">'+icn("download")+L2("Your progress","تقدمك")+'</h3><div class="col-actions"><button class="bbtn" id="stbk">'+icn("download")+" "+L2("Backup / restore","نسخ احتياطي / استعادة")+'</button><button class="bbtn danger" id="strst">'+L2("Reset progress","إعادة ضبط التقدم")+'</button></div>'+
  '<p class="sh-foot">Egypt Quest v'+VERSION+' · '+L2("progress saves on this device","يُحفظ التقدم على هذا الجهاز")+'</p></div>';
 m.style.display="flex";
 $("stc").onclick=()=>{m.style.display="none"};
 m.querySelectorAll("[data-set]").forEach(x=>x.onclick=()=>{const k=x.dataset.set;
  if(k==="sound"){muted=!muted;updMute();if(!muted)snd("tap")}else if(k==="vib"){vibOn=!vibOn;if(vibOn&&navigator.vibrate)try{navigator.vibrate(30)}catch(e){}}else if(k==="motion")motionOff=!motionOff;
  render();openSettings()});
 m.querySelectorAll("[data-lang]").forEach(x=>x.onclick=()=>{lang=x.dataset.lang;render();openSettings()});
 m.querySelectorAll("[data-th]").forEach(x=>x.onclick=()=>{themeMode=x.dataset.th;if(themeMode==="auto")applyAutoTheme();else theme=themeMode;render();openSettings()});
 if($("stloc"))$("stloc").onclick=async()=>{const ok=await Daylight.askPrecise();toastTx=ok?L2("Location set — Auto map style updated","تم تحديد الموقع — تم تحديث شكل الخريطة"):L2("Location not available — using approximate time","الموقع غير متاح — نستخدم توقيتًا تقريبيًا");toastT=performance.now()+2500;applyAutoTheme();render();if(m.style.display==="flex")openSettings()};
 $("stbk").onclick=openBackup;
 let armed=false;$("strst").onclick=()=>{if(!armed){armed=true;$("strst").textContent=L2("Tap again to confirm","اضغط مرة أخرى للتأكيد");return}resetProgress();m.style.display="none";render()}}
$("gear").onclick=openSettings;
