const OUT=[[25.15,31.65],[29.9,31.2],[32.3,31.25],[34.25,31.3],[34.9,29.5],[34.5,28.5],[34.25,27.75],[33.6,28.4],[32.65,29.9],[32.6,29.5],[33.4,28.1],[33.8,27.25],[34.9,25.5],[36.9,22],[25,22]];
/* The Nile, south → north (lon, lat): Lake Nasser from the Sudan border to the High Dam,
   then Aswan, Edfu, Luxor, the Qena bend, Asyut, Minya, Cairo and the Damietta branch.
   Boats sail along this path; the artwork in map-art.js paints the river from it. */
const NILE=[[31.36,22],[31.64,22.34],[31.96,22.78],[32.42,23.26],[32.73,23.63],[32.88,23.98],[32.9,24.09],[32.93,24.45],[32.87,24.98],[32.55,25.29],[32.64,25.69],[32.72,26.15],[32.25,26.05],[31.9,26.33],[31.69,26.56],[31.38,26.95],[31.18,27.18],[30.83,27.62],[30.75,28.1],[30.83,28.6],[31.1,29.07],[31.23,29.6],[31.23,30.04],[31.18,30.2],[31.3,30.55],[31.38,30.8],[31.5,30.95],[31.75,31.15],[31.82,31.24]];
const GOVS=[
 ["Matrouh","\u0645\u0637\u0631\u0648\u062d",27.45,30.15],["Alexandria","\u0627\u0644\u0625\u0633\u0643\u0646\u062f\u0631\u064a\u0629",29.92,31.18],["Beheira","\u0627\u0644\u0628\u062d\u064a\u0631\u0629",30.35,30.65],
 ["Kafr El Sheikh","\u0643\u0641\u0631 \u0627\u0644\u0634\u064a\u062e",30.95,31.28],["Gharbia","\u0627\u0644\u063a\u0631\u0628\u064a\u0629",31.00,30.88],["Monufia","\u0627\u0644\u0645\u0646\u0648\u0641\u064a\u0629",30.85,30.58],
 ["Qalyubia","\u0627\u0644\u0642\u0644\u064a\u0648\u0628\u064a\u0629",31.18,30.32],["Dakahlia","\u0627\u0644\u062f\u0642\u0647\u0644\u064a\u0629",31.40,31.12],["Damietta","\u062f\u0645\u064a\u0627\u0637",31.82,31.42],
 ["Port Said","\u0628\u0648\u0631\u0633\u0639\u064a\u062f",32.30,31.28],["Ismailia","\u0627\u0644\u0625\u0633\u0645\u0627\u0639\u064a\u0644\u064a\u0629",32.30,30.58],["Suez","\u0627\u0644\u0633\u0648\u064a\u0633",32.55,30.02],
 ["North Sinai","\u0634\u0645\u0627\u0644 \u0633\u064a\u0646\u0627\u0621",33.55,30.78],["South Sinai","\u062c\u0646\u0648\u0628 \u0633\u064a\u0646\u0627\u0621",33.72,28.55],["Cairo","\u0627\u0644\u0642\u0627\u0647\u0631\u0629",31.25,30.08],
 ["Giza","\u0627\u0644\u062c\u064a\u0632\u0629",30.88,29.92],["Fayoum","\u0627\u0644\u0641\u064a\u0648\u0645",30.82,29.32],["Beni Suef","\u0628\u0646\u064a \u0633\u0648\u064a\u0641",31.00,28.90],
 ["Minya","\u0627\u0644\u0645\u0646\u064a\u0627",30.75,28.12],["Asyut","\u0623\u0633\u064a\u0648\u0637",31.18,27.18],["Sohag","\u0633\u0648\u0647\u0627\u062c",31.70,26.50],
 ["Qena","\u0642\u0646\u0627",32.72,26.15],["Luxor","\u0627\u0644\u0623\u0642\u0635\u0631",32.65,25.70],["Aswan","\u0623\u0633\u0648\u0627\u0646",32.90,24.10],
 ["Red Sea","\u0627\u0644\u0628\u062d\u0631 \u0627\u0644\u0623\u062d\u0645\u0631",34.05,26.55],["New Valley","\u0627\u0644\u0648\u0627\u062f\u064a \u0627\u0644\u062c\u062f\u064a\u062f",28.55,25.45],["Sharqia","\u0627\u0644\u0634\u0631\u0642\u064a\u0629",31.55,30.72]
];

/* ---------- MAP ---------- */
const MH=()=>H-adH; // map area height (screen minus ad banner)
const MAP_TOP=()=>W>720?56:24;   // extra space reserved under the top HUD bar (px)
const mapS=()=>Math.min(W*.92/12,(MH()-170-MAP_TOP())/9.8);
const mapCY=()=>MH()/2+8+MAP_TOP()/2; // screen y of latitude 26.9° at zoom 1
const mp=(lo,la)=>{const s=mapS()*MV.z;return[W/2+MV.ox+(lo-31)*s,mapCY()+MV.oy-(la-26.9)*s]};
const MV={z:1,ox:0,oy:0};const mptr=new Map();let mmoved=0,mpinch=0;
const ROSETTA=[[31.18,30.2],[30.95,30.5],[30.82,30.85],[30.55,31.05],[30.4,31.21]]; // Rosetta branch of the Delta
function clampMV(){MV.z=Math.max(1,Math.min(3.2,MV.z));const lim=(MV.z-1)*Math.max(W,H)*.42;MV.ox=Math.max(-lim,Math.min(lim,MV.ox));MV.oy=Math.max(-lim,Math.min(lim,MV.oy));if(MV.z===1){MV.ox=0;MV.oy=0}}
function mapZoom(px,py,f){const nz=Math.max(1,Math.min(3.2,MV.z*f)),r=nz/MV.z,cx=px-W/2,cy=py-mapCY();MV.ox=cx-(cx-MV.ox)*r;MV.oy=cy-(cy-MV.oy)*r;MV.z=nz;clampMV()}
function mapMove(e){const p=mptr.get(e.pointerId);if(!p)return;
 if(mptr.size===1){MV.ox+=e.clientX-p.x;MV.oy+=e.clientY-p.y;mmoved+=Math.abs(e.clientX-p.x)+Math.abs(e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;clampMV()}
 else{p.x=e.clientX;p.y=e.clientY;const[a,b]=[...mptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);mmoved=99;if(mpinch)mapZoom((a.x+b.x)/2,(a.y+b.y)/2,d/mpinch);mpinch=d}}
function mapUp(e){if(mptr.size===1&&mmoved<8&&mptr.has(e.pointerId))mapPick(e.clientX,e.clientY);mptr.delete(e.pointerId);mpinch=0}
function lineMap(pts){ctx.beginPath();pts.forEach(([a,b],i)=>{const p=mp(a,b);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])})}
function smoothMap(pts){ctx.beginPath();pts.forEach(([a,b],i)=>{const p=mp(a,b);if(!i)ctx.moveTo(p[0],p[1]);else{const q=mp(...pts[i-1]);ctx.quadraticCurveTo(q[0],q[1],(q[0]+p[0])/2,(q[1]+p[1])/2)}})}
function alongNile(u){const n=NILE.length-1,f=u*n,i=Math.min(n-1,Math.floor(f)),k=f-i,a=NILE[i],b=NILE[i+1];return mp(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k)}
function boat(x,y,s,dir){ctx.save();ctx.translate(x,y);ctx.scale(dir*s,s);ctx.fillStyle="#7a4a1a";ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.lineTo(6,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(9,-1);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();ctx.restore()}
function camel(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="#8a5a28";ctx.beginPath();ctx.ellipse(0,0,10,5,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(-3,-6,4,0,7);ctx.arc(3,-6,4,0,7);ctx.fill();ctx.fillRect(8,-10,3,8);ctx.beginPath();ctx.arc(11,-11,3,0,7);ctx.fill();ctx.fillRect(-7,3,2,7);ctx.fillRect(5,3,2,7);ctx.restore()}
function mapLogo(img,x,y,r){const size=Math.min(img.naturalWidth||1,img.naturalHeight||1),sx=((img.naturalWidth||size)-size)/2,sy=((img.naturalHeight||size)-size)/2;
 ctx.save();ctx.shadowColor="rgba(0,0,0,.38)";ctx.shadowBlur=9;ctx.fillStyle="#17283a";ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.beginPath();ctx.arc(x,y,r-2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,sx,sy,size,size,x-r+2,y-r+2,2*r-4,2*r-4);ctx.restore();
 ctx.save();ctx.beginPath();ctx.arc(x,y,r-1,0,Math.PI*2);ctx.strokeStyle="#ffe4a0";ctx.lineWidth=2.5;ctx.stroke();ctx.beginPath();ctx.arc(x-r*.28,y-r*.3,r*.22,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,.28)";ctx.fill();ctx.restore()}
/* Fallback marker art when a place has no logo image: drawn by the place's own icon(ctx). */
function icon(st,x,y,k){ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle="#4a2f0a";ctx.strokeStyle="#4a2f0a";ctx.lineWidth=1.8;ctx.lineJoin="round";
 try{st.icon&&st.icon(ctx)}catch(e){}
 ctx.restore()}
/* Vector glyphs used on the map (no emoji). */
function starPath(x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;ctx[i?"lineTo":"moveTo"](x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath()}
function skullGlyph(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,-2,6,Math.PI,0);ctx.lineTo(6,1);ctx.quadraticCurveTo(5,4,3,4.5);ctx.lineTo(3,7);ctx.lineTo(-3,7);ctx.lineTo(-3,4.5);ctx.quadraticCurveTo(-5,4,-6,1);ctx.closePath();ctx.fill();
 ctx.fillStyle="#2a1208";ctx.beginPath();ctx.arc(-2.4,-1,1.7,0,7);ctx.arc(2.4,-1,1.7,0,7);ctx.fill();ctx.restore()}
function shieldGlyph(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(6,-4.5);ctx.lineTo(5.3,2);ctx.quadraticCurveTo(3.5,5.6,0,7.5);ctx.quadraticCurveTo(-3.5,5.6,-5.3,2);ctx.lineTo(-6,-4.5);ctx.closePath();
 ctx.fillStyle=col;ctx.fill();ctx.strokeStyle="#3a2208";ctx.lineWidth=1.2;ctx.stroke();ctx.restore()}
/* Gold compass rose (bottom-left). */
function compassRose(x,y,r){ctx.save();ctx.translate(x,y);
 ctx.fillStyle="rgba(8,18,31,.55)";ctx.beginPath();ctx.arc(0,0,r+4,0,7);ctx.fill();
 ctx.strokeStyle="rgba(243,201,105,.75)";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();ctx.strokeStyle="rgba(243,201,105,.35)";ctx.beginPath();ctx.arc(0,0,r-4,0,7);ctx.stroke();
 for(let i=0;i<8;i++){const a=i*Math.PI/4,L=i%2?r*.5:r*.92,w=i%2?r*.1:r*.16;ctx.save();ctx.rotate(a);
  ctx.beginPath();ctx.moveTo(0,-L);ctx.lineTo(w,0);ctx.lineTo(0,0);ctx.closePath();ctx.fillStyle=i===0?"#ffe3a0":i%2?"rgba(243,201,105,.55)":"#e0b456";ctx.fill();
  ctx.beginPath();ctx.moveTo(0,-L);ctx.lineTo(-w,0);ctx.lineTo(0,0);ctx.closePath();ctx.fillStyle=i===0?"#c9973d":i%2?"rgba(150,110,45,.55)":"#9c7432";ctx.fill();ctx.restore()}
 ctx.fillStyle="#ffe3a0";ctx.beginPath();ctx.arc(0,0,1.8,0,7);ctx.fill();
 ctx.font="700 11px Georgia,'Times New Roman',serif";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillStyle="#ffe3a0";ctx.fillText(lang==="ar"?"ش":"N",0,-r-7);ctx.restore()}
/* Governorate label tiers: tier 2 (small Delta/Canal governorates) fades in when zoomed. */
const GOV_T2=new Set(["Beheira","Kafr El Sheikh","Gharbia","Monufia","Qalyubia","Dakahlia","Damietta","Port Said","Ismailia","Suez","Cairo","Giza","Sharqia"]);
const smooth01=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
function drawMap(t){
 const ar=lang==="ar",s0=mapS()*MV.z,zz=Math.sqrt(MV.z);
 /* Background layer: illustrated, code-painted artwork (seas, terrain, Nile, Delta…).
    It contains no text or interactive elements — see js/map-art.js. Everything below is drawn on top of it. */
 MapArt.draw(t);
 /* Sea & region names (rendered by code, never baked into the artwork) */
 ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
 const serif=(sz,st)=>(st||"italic")+" "+Math.round(sz)+"px Georgia,'Times New Roman',serif",sp=v=>{if("letterSpacing" in ctx)ctx.letterSpacing=ar?"0px":v};
 const sl=(tx,a,b,rot)=>{const p=mp(a,b);ctx.save();ctx.translate(p[0],p[1]);if(rot)ctx.rotate(rot);ctx.fillText(tx,0,0);ctx.restore()};
 ctx.font=serif(Math.max(12,s0*.24));sp("0.18em");ctx.fillStyle="rgba(214,232,240,.55)";
 sl(ar?"البحر المتوسط":"Mediterranean Sea",27.4,31.88);
 {const a=mp(34.6,27.6),b=mp(37.6,22.6);sl(ar?"البحر الأحمر":"Red Sea",36.0,25.1,Math.atan2(b[1]-a[1],b[0]-a[0]))}
 ctx.font=serif(Math.max(11,s0*.21));sp("0.32em");ctx.fillStyle="rgba(92,58,22,.5)";
 sl(ar?"الصحراء الغربية":"WESTERN DESERT",27.8,26.3);sl(ar?"سيناء":"SINAI",33.75,29.75);sp("0px");ctx.restore();
 // Bir Tawil (unclaimed land south of the border) — name always, "unclaimed land" note when zoomed in
 {const[x,y]=mp(33.68,21.48),fs=Math.max(9,Math.min(13,Math.round(s0*.15)));ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  ctx.font="italic 600 "+fs+"px Georgia,'Times New Roman',serif";ctx.lineWidth=3;ctx.strokeStyle="rgba(10,20,32,.75)";ctx.fillStyle="rgba(255,227,160,.92)";
  const nm=ar?"بئر طويل":"Bir Tawil";ctx.strokeText(nm,x,y);ctx.fillText(nm,x,y);
  const a=smooth01(45,70,s0);if(a>.03){ctx.globalAlpha=a;ctx.font="italic "+Math.max(8,fs-2)+"px Georgia,'Times New Roman',serif";const sub2=ar?"أرض غير مُطالَب بها":"unclaimed land";ctx.strokeText(sub2,x,y+fs+2);ctx.fillText(sub2,x,y+fs+2)}ctx.restore()}
 // governorate names (round joins: mitred outlines grow spikes on M, N, V, W)
 ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
 const gf=Math.max(8,Math.min(12,Math.round(s0*.14))),a1=.85*smooth01(16,28,s0),a2=.85*smooth01(68,100,s0);
 ctx.font="600 "+gf+"px system-ui";if("letterSpacing" in ctx)ctx.letterSpacing=ar?"0px":"0.06em";
 GOVS.forEach(([en,arName,lo,la])=>{const al=GOV_T2.has(en)?a2:a1;if(al<.03)return;const[x,y]=mp(lo,la),name=ar?arName:en.toUpperCase();
  ctx.globalAlpha=al;ctx.fillStyle="rgba(250,240,214,.9)";ctx.strokeStyle="rgba(48,30,10,.55)";ctx.lineWidth=3;ctx.strokeText(name,x,y);ctx.fillText(name,x,y);
 });if("letterSpacing" in ctx)ctx.letterSpacing="0px";ctx.restore();
 // life on the map
 for(const[ph,sp]of[[0,7000],[2.2,9000]]){const u=.5+.45*Math.sin(t/sp+ph),d=Math.cos(t/sp+ph)>=0?1:-1,p=alongNile(u);boat(p[0],p[1],Math.max(.8,zz),d)}
 {const u=(t/22000)%1;for(let k=0;k<3;k++){const uu=((u-k*.06)+1)%1,p=mp(26.3+uu*2.8,27.3+Math.sin(uu*6)*.18);camel(p[0],p[1],1.1*Math.max(.8,zz))}}
 {const p=mp(27+((t/30000)%1)*5,32.0);boat(p[0],p[1],Math.max(.9,zz),1);const u2=(t/40000)%1,q=mp(36.2-u2*1.45,25.4+u2*2);boat(q[0],q[1],Math.max(.9,zz),-1)}
 // compass
 compassRose(46,MH()-122,22);
 // markers
 /* v4.3: a newly opened place pops in with gold rings (~1.2 s, tap to skip, off with reduced motion) */
 if(revealAt&&(motionReduced()||t-revealAt.t0>1200))revealAt=null;
 const nl=nextLocked();SITES.forEach((st,i)=>{if(!unlocked(i)&&i!==nl)return;const rv=revealAt&&revealAt.id===st.id?Math.max(0,(t-revealAt.t0)/1200):1;const[qx,qy]=mp(st.lon,st.lat),x=qx+(st.mapDx||0),y=qy+(st.mapDy||0),on=sel&&sel.id===st.id,lk=!unlocked(i),dn=done.has(st.id),bob=on?Math.sin(t/180)*3:0,k=(on?1.25:1)*(rv<1?.35+.65*(1-Math.pow(1-rv,3)):1),R=17*k;
  if(rv<1){ctx.save();for(let j=0;j<3;j++){const q=rv*1.4-j*.2;if(q<=0||q>=1)continue;ctx.globalAlpha=1-q;ctx.beginPath();ctx.arc(x,y,17+q*60,0,7);ctx.strokeStyle="#ffe08a";ctx.lineWidth=3*(1-q)+1;ctx.stroke()}ctx.restore()}
  if(!lk&&!dn){const p=1+.22*Math.sin(t/400+i);ctx.beginPath();ctx.arc(x,y+bob,(R+6)*p,0,7);ctx.strokeStyle="rgba(255,224,138,.8)";ctx.lineWidth=2;ctx.stroke()}
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(x+2,y+R+4,R*.8,5,0,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(x,y+bob,R,0,7);ctx.fillStyle=lk?"#8a8f9c":dn?"#6ccf7f":"#f2c14e";ctx.fill();ctx.lineWidth=lk?3:frame==="gold"?3:4;ctx.strokeStyle=lk?"#fff7dd":(FRAMES[frame]||FRAMES.gold).c;ctx.stroke();
  if(lk)ctx.globalAlpha=.45;if(st.logoImg&&st.logoImg.complete&&st.logoImg.naturalWidth)mapLogo(st.logoImg,x,y+bob,R);else icon(st,x,y+bob,k*(lk?.9:1));ctx.globalAlpha=1;
  if(lk){const pp=placeProg(i);if(pp){ctx.save();ctx.lineCap="round";ctx.lineWidth=3.5;ctx.strokeStyle="rgba(13,24,39,.7)";ctx.beginPath();ctx.arc(x,y+bob,R+6,0,7);ctx.stroke();if(pp.frac>0){ctx.strokeStyle="#f3c969";ctx.beginPath();ctx.arc(x,y+bob,R+6,-Math.PI/2,-Math.PI/2+Math.PI*2*pp.frac);ctx.stroke()}ctx.restore()}}
  if(lk){ctx.fillStyle="#2a2f40";ctx.fillRect(x+6*k,y+bob+4*k,10*k,8*k);ctx.strokeStyle="#2a2f40";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+11*k,y+bob+4*k,3.5*k,Math.PI,0);ctx.stroke()}
  const n3=starSum(st.id);if(n3){ctx.save();ctx.font="700 10px system-ui";const tw=ctx.measureText(String(n3)).width,pw=tw+19,px=x-pw/2,py=y+bob-R-17;ctx.fillStyle="rgba(13,24,39,.85)";rr(px,py,pw,14,7);ctx.fill();ctx.strokeStyle="rgba(243,201,105,.6)";ctx.lineWidth=1;ctx.stroke();
   starPath(px+8,py+7,4.5);ctx.fillStyle="#f3c969";ctx.fill();ctx.fillStyle="#fff4d0";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(String(n3),px+14,py+7.5);ctx.restore()}
  if(st.id===dailyId&&dailyClaim!==today()&&!lk){const bx=x+R*.85,by=y+bob-R*.85;ctx.save();ctx.fillStyle="#13243a";ctx.beginPath();ctx.arc(bx,by,9,0,7);ctx.fill();ctx.strokeStyle="#ffe3a0";ctx.lineWidth=1.5;ctx.stroke();starPath(bx,by+.5,6);ctx.fillStyle="#f3c969";ctx.fill();ctx.restore()}
  if(on||MV.z>1.35||W>720){ctx.font="bold 12px system-ui";const nm=ar?st.ar:st.en,w=ctx.measureText(nm).width+14;ctx.fillStyle="rgba(20,26,40,.82)";rr(x-w/2,y+R+10,w,20,10);ctx.fill();ctx.fillStyle="#fff4d0";ctx.textAlign="center";ctx.fillText(nm,x,y+R+24)}});
}
function mapPick(px,py){revealAt=null;if(gs){const[gx,gy]=mp(gs.lo,gs.la);if(Math.hypot(px-gx,py-gy)<36){if(gs.cursed){const n=loseBal(Math.round(20*RATE));gfx.push({x:gx,y:gy,t0:performance.now(),txt:n?"−"+n:L2("Blocked","تم الصد"),icon:n?"skull":"shield",bad:true});gs=null;snd("bad");render();return}gfx.push({x:gx,y:gy,t0:performance.now()});gs=null;score+=Math.round(15*RATE);qAdd("scarab",1);snd("ok");render();return}}let best=null,bd=26;const nl=nextLocked();SITES.forEach((s,k)=>{if(!unlocked(k)&&k!==nl)return;const[x,y]=mp(s.lon,s.lat),d=Math.hypot(px-x,py-y);if(d<bd){bd=d;best=s}});if(best)select(best.id)}
let gs=null,gsNext=performance.now()+12000,gfx=[];
const inEgypt=(lo,la)=>{let c=false;for(let i=0,j=OUT.length-1;i<OUT.length;j=i++){const[a,b]=OUT[i],[p,q]=OUT[j];if((b>la)!==(q>la)&&lo<(p-a)*(la-b)/(q-b)+a)c=!c}return c};
function updGS(t){if(!gs&&t>gsNext){for(let k=0;k<40;k++){const lo=26+Math.random()*8.5,la=22.5+Math.random()*8.8;if(inEgypt(lo,la)){gs={lo,la,until:t+7000,cursed:Math.random()<.3};break}}gsNext=t+(18000+Math.random()*18000)*(own.has("lucky")?.5:1)}if(gs&&t>gs.until)gs=null}
function drawGS(t){if(gs){const[x,y]=mp(gs.lo,gs.la),p=1+.2*Math.sin(t/150);ctx.fillStyle=gs.cursed?"rgba(217,83,79,.45)":"rgba(255,224,138,.35)";ctx.beginPath();ctx.arc(x,y,24*p,0,7);ctx.fill();
  ctx.fillStyle=gs.cursed?"#1a1a1a":"#e6b84a";ctx.beginPath();ctx.ellipse(x,y,9,12,0,0,7);ctx.fill();ctx.strokeStyle=gs.cursed?"#d9534f":"#6a4a10";ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.moveTo(x-9,y-2);ctx.lineTo(x+9,y-2);ctx.stroke()}
 gfx=gfx.filter(f=>t-f.t0<800);gfx.forEach(f=>{const k=(t-f.t0)/800;ctx.globalAlpha=1-k;ctx.lineJoin="round";ctx.font="bold 22px system-ui";ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="#3a2208";ctx.fillStyle=f.bad?"#ff8a80":"#fff4d0";const tx=f.txt||"+"+Math.round(15*RATE),yy=f.y-k*36;ctx.strokeText(tx,f.x,yy);ctx.fillText(tx,f.x,yy);
  if(f.icon){const ix=f.x-ctx.measureText(tx).width/2-14;f.icon==="skull"?skullGlyph(ix,yy-7,1.3,"#f1e6d0"):shieldGlyph(ix,yy-7,1.3,"#f3c969")}ctx.globalAlpha=1})}
