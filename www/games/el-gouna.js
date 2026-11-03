/* El Gouna Film Festival — Egyptian movie quiz */
definePlace({
  id:"gouna",
  req:800,              // points needed to unlock (default formula when omitted)
  // map pin
  lon:33.68, lat:27.39,
  en:"El Gouna Film Festival",
  ar:"مهرجان الجونة السينمائي",
  eraEn:"Founded 2017 · Red Sea",
  eraAr:"تأسس عام 2017 · البحر الأحمر",
  dEn:"A film festival in the Red Sea resort town of El Gouna. Test your knowledge of new Egyptian movies (2015 on)!",
  dAr:"مهرجان سينمائي في مدينة الجونة على البحر الأحمر. اختبر معلوماتك عن الأفلام المصرية الجديدة (من 2015)!",
  logo:"assets/images/el-gouna.jpg",
  // challenge meta
  challenge:["Egyptian movie quiz","أسئلة عن الأفلام المصرية"],
  par:45,                // seconds for full speed bonus at level 1
  starTip:["Few mistakes and fast answers","أخطاء قليلة وإجابات سريعة"],
  levels:(x,k)=>L2((5+Math.min(x,5))+" questions",(5+Math.min(x,5))+" أسئلة"),
  fact:["El Gouna Film Festival was founded in 2017, and its awards are called the Stars of El Gouna.","تأسس مهرجان الجونة السينمائي عام 2017، وتُسمّى جوائزه «نجمة الجونة»."],
  icon(ctx){ctx.fillRect(-9,-1,18,9);ctx.beginPath();ctx.moveTo(-9,-3);ctx.lineTo(9,-8);ctx.lineTo(9,-4);ctx.lineTo(-9,1);ctx.closePath();ctx.fill();},
  game:(()=>{
 /* Hand-written bank: Egyptian films from 2015 on (stars, directors, years, plots) + film jokes.
    Mixed with fresh Wikidata questions (also limited to films from MIN_YEAR on).
    The jokes are original riddles about the titles/plots — not quotes from the films. */
 const MIN_YEAR=2015;
 const FILMS=["ولاد رزق","حملة فريزر","الخلية","هروب اضطراري","الكنز","البدلة","الديزل","حرب كرموز","تراب الماس","الكويسين","الممر","الفيل الأزرق 2","كازابلانكا","صاحب المقام","لص بغداد","الإنس والنمس","البعض لا يذهب للمأذون مرتين","كيرة والجن","واحد تاني","من أجل زيكو","بيت الروبي","الحريفة","خير وبركة"];
 const MEN=["أحمد عز","كريم عبد العزيز","أمير كرارة","محمد رمضان","تامر حسني","أحمد حلمي","محمد هنيدي","آسر ياسين","أحمد السقا","محمد إمام","هشام ماجد","كريم محمود عبد العزيز","نور النبوي","أحمد فهمي","علي ربيع"];
 const DIRS=["طارق العريان","مروان حامد","شريف عرفة","بيتر ميمي","سامح عبد العزيز","هادي الباجوري"];
 const TY={actor:["مين بطل الفيلم؟","Who's the star?"],dir:["مين المخرج؟","Who directed it?"],year:["اتعرض سنة كام؟","Release year"],scene:["الحدوتة دي من فيلم إيه؟","Which film is this plot from?"],joke:["نكتة سينما: الفيلم ده إيه؟","Film joke: which film?"]};
 /* A: star (x = co-stars that must not appear as wrong options) · D: director · Y: year · S: plot · J: joke */
 const A=(f,a,x)=>({t:"actor",q:"مين بطل فيلم "+f+"؟",a,pool:MEN.filter(m=>!(x||[]).includes(m))}),D=(f,a)=>({t:"dir",q:"مين مخرج فيلم "+f+"؟",a,pool:DIRS}),
  Y=(f,y)=>({t:"year",q:"فيلم "+f+" اتعرض سنة كام؟",a:String(y),w:[-3,-2,-1,1,2,3].map(d=>y+d).filter(v=>v<=new Date().getFullYear()).map(String)}),
  S=(q,a)=>({t:"scene",q,a,pool:FILMS}),J=(q,a)=>({t:"joke",q,a,pool:FILMS});
 const BANK=[
  A("ولاد رزق","أحمد عز"),A("الخلية","أحمد عز"),A("الممر","أحمد عز"),A("كازابلانكا","أمير كرارة"),A("حرب كرموز","أمير كرارة"),A("الديزل","محمد رمضان"),
  A("البدلة","تامر حسني",["أكرم حسني"]),A("واحد تاني","أحمد حلمي"),A("الإنس والنمس","محمد هنيدي"),A("تراب الماس","آسر ياسين"),A("صاحب المقام","آسر ياسين"),
  A("هروب اضطراري","أحمد السقا"),A("لص بغداد","محمد إمام"),A("الحريفة","نور النبوي"),A("الكويسين","أحمد فهمي"),A("خير وبركة","علي ربيع"),
  A("الفيل الأزرق 2","كريم عبد العزيز"),A("بيت الروبي","كريم عبد العزيز"),A("البعض لا يذهب للمأذون مرتين","كريم عبد العزيز"),A("من أجل زيكو","كريم محمود عبد العزيز"),
  {t:"actor",q:"مين لعب دور «كيرة» في فيلم كيرة والجن؟",a:"كريم عبد العزيز",pool:MEN.filter(m=>m!=="أحمد عز")},
  {t:"actor",q:"مين الثنائي بطل فيلم حملة فريزر؟",a:"هشام ماجد وشيكو",w:["أحمد فهمي وأكرم حسني","علي ربيع ومحمد عبد الرحمن","تامر حسني وأكرم حسني"]},
  D("ولاد رزق","طارق العريان"),D("الخلية","طارق العريان"),D("الممر","شريف عرفة"),D("الكنز","شريف عرفة"),D("كيرة والجن","مروان حامد"),D("الفيل الأزرق 2","مروان حامد"),
  D("تراب الماس","مروان حامد"),D("كازابلانكا","بيتر ميمي"),D("حرب كرموز","بيتر ميمي"),D("حملة فريزر","سامح عبد العزيز"),
  Y("ولاد رزق",2015),Y("حملة فريزر",2016),Y("الخلية",2017),Y("هروب اضطراري",2017),Y("البدلة",2018),Y("الديزل",2018),Y("الممر",2019),Y("الفيل الأزرق 2",2019),
  Y("كازابلانكا",2019),Y("صاحب المقام",2020),Y("الإنس والنمس",2021),Y("كيرة والجن",2022),Y("واحد تاني",2022),Y("من أجل زيكو",2022),Y("بيت الروبي",2023),Y("الحريفة",2024),
  S("إخوات حرامية بيقرروا يعملوا عملية أخيرة كبيرة ويتوبوا بعدها","ولاد رزق"),
  S("اتنين صحاب يلبسوا لبس ظباط شرطة في حفلة… والناس تصدق إنهم ظباط بجد","البدلة"),
  S("أم وأب بيعملوا رحلة طويلة عشان ابنهم يدخل مسابقة أذكى طفل","من أجل زيكو"),
  S("فرقة كوماندوز مصرية بتنفذ عملية ورا خطوط العدو بعد نكسة 67","الممر"),
  S("مقاومة مصرية ضد الاحتلال الإنجليزي أيام ثورة 1919","كيرة والجن"),
  S("رجل أعمال بيهدّ ضريح ولي عشان مشروع، وبعدها حياته تتقلب","صاحب المقام"),
  S("ولد بينقل مدرسة جديدة ويكوّن فريق كورة شوارع","الحريفة"),
  S("الطبيب النفسي يحيى بيرجع لعنبر «8 غرب» في جزء تاني من الحكاية","الفيل الأزرق 2"),
  J("واحد لبس لبس ظابط في حفلة تنكرية… ونسي يقلعه لحد آخر الفيلم!","البدلة"),
  J("لو قفلت باب بيتك كويس عشان الحرامية… هتلاقيهم إخوات وكلهم من عيلة واحدة!","ولاد رزق"),
  J("حملة… بس مش انتخابية ولا إعلانية، دي متلّجة!","حملة فريزر"),
  J("نوع بنزين… بس بطله محمد رمضان مش عربية نقل!","الديزل"),
  J("خلية… بس مافيهاش نحل ولا عسل، فيها أكشن!","الخلية"),
  J("تراب… بس لو لقيته على الأرض هتبقى مليونير!","تراب الماس"),
  J("مدينة في المغرب… بس الفيلم مصري وبطله أمير كرارة!","كازابلانكا"),
  J("حرب… بس جوه حي في إسكندرية!","حرب كرموز"),
  J("حرامي… بس جاي من العراق!","لص بغداد"),
  J("لو زهقت من نفسك وعاوز تبقى حد غيرك… الفيلم ده اسمه إيه؟","واحد تاني"),
  J("الناس الطيبين… بس بالمصري!","الكويسين"),
  J("ممر… بس مش ممر مشاة، ده في حرب!","الممر"),
  J("بيت… كل اللي ساكنين فيه اسمهم الروبي!","بيت الروبي"),
  J("لاعيبة كورة شوارع… كل واحد فيهم حريف!","الحريفة"),
  J("فيل… بس لونه مش رمادي، والجزء التاني كمان!","الفيل الأزرق 2"),
  J("كنز… والعنوان بيقولك على طول بتدوّر على إيه!","الكنز"),
  J("الأغلبية بتروح للمأذون مرة واحدة… بس في ناس…","البعض لا يذهب للمأذون مرتين"),
  J("هروب… بس مش بمزاجك، غصب عنك!","هروب اضطراري"),
  J("الخير… ومعاه البركة كمان، وبطله علي ربيع!","خير وبركة")];
 const LOCAL=BANK.map((q,i)=>{const n=4;let wrong=q.w?[...q.w]:q.pool.filter(x=>x!==q.a);wrong=QGen.shuf(wrong).slice(0,n-1);const opts=QGen.shuf([q.a,...wrong]).map(x=>[x,x]);
  return{key:"g15:"+i,lt:q.t,cat:["🎬 "+TY[q.t][1],"🎬 "+TY[q.t][0]],q:[q.q,q.q],opts,ans:opts.findIndex(o=>o[0]===q.a)}});
 let nq=5,tlim=0,nopt=3;
 const film=t=>{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#3a0f1c");g.addColorStop(1,"#0e0a1a");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const sp=ctx.createRadialGradient(W/2,60,10,W/2,60,W*.7);sp.addColorStop(0,"rgba(255,224,138,.28)");sp.addColorStop(1,"rgba(255,224,138,0)");ctx.fillStyle=sp;ctx.fillRect(0,0,W,H);
  if(W>=340){ctx.fillStyle="#0a0a0f";ctx.fillRect(4,0,22,H);ctx.fillRect(W-26,0,22,H);ctx.fillStyle="#d8c8a0";for(let y=((t/40)%26)-26;y<H;y+=26){ctx.fillRect(9,y,12,14);ctx.fillRect(W-21,y,12,14)}}};
 const V=makeQuizView({bg:film,timeLimit:()=>tlim,onEnd:(c,e)=>winGame(e===0?3:e<=1?2:1)});
 return{help:{en:"Egyptian cinema quiz — films from 2015 on! Recognise the stars, films, directors and years, and solve the film jokes. Every game has new questions. 3 right in a row = coins ×1.2, 5 in a row = ×1.5.",ar:"مسابقة السينما المصرية — أفلام من 2015 وبعدها! اعرف النجوم والأفلام والمخرجين وسنين العرض، وحل نكت السينما. أسئلة جديدة في كل مرة. 3 إجابات صحيحة متتالية = العملات ×1.2، و5 متتالية = ×1.5."},
 start(){const x=LV();nq=5+Math.min(x,5);nopt=x<2?3:4;tlim=x>=3?Math.max(8,20-(x-3)*6):0;
  const kinds=x<1?["photo","film"]:x<2?["photo","film","year"]:["photo","film","year","dir"];
  const types=x<1?["joke","actor"]:x<2?["joke","actor","scene"]:["joke","actor","scene","dir","year"];
  const local=LOCAL.filter(q=>types.includes(q.lt)).map(q=>{if(q.opts.length>nopt){const a=q.opts[q.ans],w=QGen.shuf(q.opts.filter((_,i)=>i!==q.ans)).slice(0,nopt-1),o=QGen.shuf([a,...w]);return{...q,opts:o,ans:o.indexOf(a)}}return q});
  V.load(QGen.cinema(nq,nopt,kinds,local,x,MIN_YEAR))},
 status(){return V.loading?L2("Loading…","جاري التحميل…"):L2("Question ","السؤال ")+Math.min(V.index+1,V.count||nq)+"/"+(V.count||nq)+" · "+L2("Mistakes ","الأخطاء ")+V.errs+V.comboTxt()},
 draw:t=>V.draw(t),tap:(x,y)=>V.tap(x,y),quiz:V}})()
});
