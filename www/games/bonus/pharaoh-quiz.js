/* Bonus game: Pharaoh Quiz — fresh questions every time (Wikidata + Open Trivia DB),
   never repeated; the built-in BANK is the offline fallback. Win = at least 3 of 5 right. */
defineBonus({
  id:"quiz",
  name:["Pharaoh Quiz","مسابقة الفراعنة"],
  desc:["5 new questions every time · 3 right to win","5 أسئلة جديدة كل مرة · 3 إجابات صحيحة للفوز"],
  target:3,
  game:(()=>{const BANK=[
 [["Which river flows through Egypt?","أي نهر يجري في مصر؟"],[["The Nile","النيل"],["The Tigris","دجلة"],["The Danube","الدانوب"],["The Amazon","الأمازون"]]],
 [["Who built the Great Pyramid of Giza?","من بنى الهرم الأكبر بالجيزة؟"],[["Khufu","خوفو"],["Ramesses II","رمسيس الثاني"],["Tutankhamun","توت عنخ آمون"],["Cleopatra","كليوباترا"]]],
 [["Which pharaoh built Abu Simbel?","أي فرعون بنى أبو سمبل؟"],[["Ramesses II","رمسيس الثاني"],["Khufu","خوفو"],["Akhenaten","إخناتون"],["Ptolemy I","بطليموس الأول"]]],
 [["In which city is Karnak Temple?","في أي مدينة يقع معبد الكرنك؟"],[["Luxor","الأقصر"],["Aswan","أسوان"],["Cairo","القاهرة"],["Alexandria","الإسكندرية"]]],
 [["Philae Temple was dedicated to which goddess?","لأي إلهة كُرّس معبد فيلة؟"],[["Isis","إيزيس"],["Hathor","حتحور"],["Bastet","باستت"],["Sekhmet","سخمت"]]],
 [["Which famous lighthouse stood in Alexandria?","أي فنار شهير كان في الإسكندرية؟"],[["The Pharos","فنار الإسكندرية"],["The Colossus","تمثال رودس"],["Big Ben","بيغ بن"],["Eddystone","إيديستون"]]],
 [["Which stone helped decode hieroglyphs?","أي حجر ساعد في فك رموز الهيروغليفية؟"],[["The Rosetta Stone","حجر رشيد"],["The Blue Stone","الحجر الأزرق"],["The Black Stone","الحجر الأسود"],["The Sphinx Stone","حجر أبو الهول"]]],
 [["The ankh symbol stands for…","يرمز مفتاح الحياة (عنخ) إلى…"],[["Life","الحياة"],["War","الحرب"],["Gold","الذهب"],["Rain","المطر"]]],
 [["Whose tomb was found almost intact in 1922?","مقبرة من وُجدت شبه سليمة عام 1922؟"],[["Tutankhamun","توت عنخ آمون"],["Khufu","خوفو"],["Ramesses II","رمسيس الثاني"],["Hatshepsut","حتشبسوت"]]],
 [["The Great Sphinx has the body of a…","جسد أبو الهول الأكبر هو جسد…"],[["Lion","أسد"],["Falcon","صقر"],["Bull","ثور"],["Crocodile","تمساح"]]],
 [["Which temple is famous for the Abydos King List?","أي معبد اشتهر بقائمة ملوك أبيدوس؟"],[["Temple of Seti I","معبد سيتي الأول"],["Karnak","الكرنك"],["Abu Simbel","أبو سمبل"],["Philae","فيلة"]]],
 [["Wadi Al-Hitan is known for fossils of early…","وادي الحيتان مشهور بحفريات…"],[["Whales","الحيتان"],["Dinosaurs","الديناصورات"],["Mammoths","الماموث"],["Sharks","أسماك القرش"]]],
 [["The White Desert is famous for its…","الصحراء البيضاء مشهورة بـ…"],[["Chalk rock formations","التكوينات الطباشيرية"],["Red sand dunes","الكثبان الحمراء"],["Salt flats","السبخات الملحية"],["Volcanoes","البراكين"]]],
 [["Which oasis is home to the Oracle of Amun?","أي واحة تضم وحي آمون؟"],[["Siwa","سيوة"],["Kharga","الخارجة"],["Bahariya","البحرية"],["Dakhla","الداخلة"]]]];
 const NQ=5,NEED=3;
 const LOCAL=BANK.map((b,i)=>{const opts=QGen.shuf(b[1].slice());return{key:"lb:"+i,cat:["🏺 Ancient Egypt","🏺 مصر القديمة"],q:b[0],opts,ans:opts.indexOf(b[1][0])}});
 const V=makeQuizView({
  bg(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#16213a");g.addColorStop(1,"#0e1420");ctx.fillStyle=g;ctx.fillRect(0,0,W,H)},
  onEnd(c){if(c>=NEED)finishBonus(c*10);else loseBonus(L2("Only "+c+"/"+NQ+" correct — you need "+NEED+".","أجبت "+c+"/"+NQ+" فقط — تحتاج "+NEED+"."))}});
 return{help:{en:"Answer 5 brand-new questions about Egypt. Get at least 3 right to win (+10 each). 3 in a row = coins ×1.2, 5 in a row = ×1.5",ar:"أجب عن 5 أسئلة جديدة عن مصر. أجب 3 على الأقل صحيحة لتفوز (+10 لكل إجابة). 3 متتالية = العملات ×1.2، و5 متتالية = ×1.5"},
 start(){V.load(QGen.egypt(NQ,4,LOCAL))},
 status(){return V.loading?L2("Loading…","جاري التحميل…"):L2("Question ","السؤال ")+Math.min(V.index+1,NQ)+"/"+NQ+" · ✓ "+V.correct+" · ✗ "+V.errs+V.comboTxt()},
 draw:t=>V.draw(t),tap:(x,y)=>V.tap(x,y),quiz:V}})()
});
