/* ============================================================
   MapArt — the illustrated BACKGROUND LAYER of the Egypt map.

   What it is
   • A code-native painting (no bitmap asset): seas with depth, neighbouring
     lands fading into the navy theme, desert sand with dunes, mountain ranges,
     escarpments, wadis, oases, the Nile valley & Delta, Lake Nasser, Suez canal.
   • Painted in GEOGRAPHIC coordinates (lon/lat) with the exact projection used
     by map.js (mapS / mapCY / MV), so it always lines up with markers, labels,
     hit-tests, boats, camels and the golden scarab.
   • Contains NO text, labels, markers, icons or UI — map.js draws all of those
     on top, and all interaction (pan, pinch, taps) stays in map.js.

   How it stays crisp and fast
   • The painting is rendered into an offscreen canvas at the screen's device
     resolution ("cache"). `home` = the default view (zoom 1); `view` = the last
     settled zoom/pan. While the player drags or pinches, the caches are just
     moved/scaled (a similarity transform); ~140 ms after the gesture stops, the
     current view is re-painted at full resolution → never blurry at rest.
   • Caches are rebuilt when the screen size, ad banner height, DPR or map
     theme changes.
   • Small live effects (sea glints, Nile shimmer, vignette) are drawn every
     frame on top of the cache by MapArt.draw().

   Public API
     MapArt.draw(t)            – called by drawMap() at the start of each frame
     MapArt.invalidate()       – force a re-paint (e.g. after editing palettes)
     MapArt.renderImage(w,h)   – standalone canvas of the artwork (no UI), for previews/export
     MapArt.stats              – {paints, lastMs} for testing
   ============================================================ */
const MapArt=(()=>{

 /* ---------- palettes per map theme (shop: classic / sunset / night) ---------- */
 const PAL={
  classic:{seaDeep:"#0a2136",seaMid:"#14445f",shelf:"#2e7b88",reef:"#5aa9a2",fog:"7,16,27",
   nb:"#4a3f31",nbEdge:"#7d6a50",
   sandHi:"#f1d49c",sand:"#e2b574",sandLo:"#c88f50",sandSh:"#93672f",
   rockHi:"#eed7a8",rock:"#a9805a",rockLo:"#6b4a2d",
   veg:"#6e7c3a",vegLo:"#4a5a25",vegHi:"#97a457",
   water:"#2d7ba0",waterLo:"#16486a",waterHi:"#a6dbe8",
   ink:"#5b3f1d",gold:"#f3c969",chalk:"#f7f2e3",salt:"#efe6cf",light:"255,236,190",night:false},
  sunset:{seaDeep:"#1d1535",seaMid:"#3a2860",shelf:"#8b4f77",reef:"#c27c8c",fog:"20,11,32",
   nb:"#4d3638",nbEdge:"#7d5650",
   sandHi:"#f6cb92",sand:"#e9a96a",sandLo:"#cb7f4c",sandSh:"#985434",
   rockHi:"#f7d3a4",rock:"#aa654b",rockLo:"#653233",
   veg:"#7c7a3d",vegLo:"#58572a",vegHi:"#a7a058",
   water:"#5a6db0",waterLo:"#323f78",waterHi:"#f4bea4",
   ink:"#5a2a22",gold:"#ffd27a",chalk:"#fde9d7",salt:"#f6dccb",light:"255,212,170",night:false},
  night:{seaDeep:"#040b17",seaMid:"#0b1d35",shelf:"#1a3c5c",reef:"#2b5d78",fog:"3,7,14",
   nb:"#1f2335",nbEdge:"#353c58",
   sandHi:"#a1a4c1",sand:"#7f83a2",sandLo:"#626688",sandSh:"#40435f",
   rockHi:"#aeb2d2",rock:"#585c7d",rockLo:"#2a2c45",
   veg:"#3b5249",vegLo:"#283a31",vegHi:"#516d5f",
   water:"#2f6197",waterLo:"#16325a",waterHi:"#93c4ef",
   ink:"#1a1d30",gold:"#e9c46a",chalk:"#cfd3ea",salt:"#b8bdd8",light:"190,205,255",night:true}
 };
 const pal=()=>PAL[theme]||PAL.classic;

 /* ---------- small helpers ---------- */
 const rng=s=>()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return"rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"};
 const pip=(poly,lo,la)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[p,q]=poly[j];if((b>la)!==(q>la)&&lo<(p-a)*(la-b)/(q-b)+a)c=!c}return c};
 const segDist=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/l));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)};
 const polyDist=(pts,lo,la)=>{let m=1e9;for(let i=0;i<pts.length-1;i++)m=Math.min(m,segDist(lo,la,pts[i],pts[i+1]));return m};
 /* projection snapshot: same formula as mp() in map.js, scaled to device pixels */
 const mkP=v=>(lo,la)=>[(v.W/2+v.ox+(lo-31)*v.s*v.z)*v.d,(v.cy+v.oy-(la-26.9)*v.s*v.z)*v.d];
 const path=(g,P,pts,close)=>{pts.forEach((q,i)=>{const[x,y]=P(q[0],q[1]);i?g.lineTo(x,y):g.moveTo(x,y)});if(close)g.closePath()};
 const spath=(g,P,pts)=>{const p=pts.map(q=>P(q[0],q[1]));g.moveTo(p[0][0],p[0][1]);
  for(let i=1;i<p.length-1;i++)g.quadraticCurveTo(p[i][0],p[i][1],(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2);
  const l=p[p.length-1];g.lineTo(l[0],l[1])};

 /* ---------- geography used only by the artwork (lon, lat) ----------
    Egypt's outline itself is OUT from map.js and is NOT changed; the coastline is
    only given a tiny natural wobble (≤0.05°) for drawing. Land borders stay straight. */
 const BORDER_EDGES=new Set([3,13,14]);   // OUT edges i→i+1: Gaza/Israel, Sudan (22°N), Libya (25°E)
 const LIBYA=[[25.15,31.65],[24.7,31.95],[24,32.1],[23.2,32.25],[22.6,32.8],[21.7,32.95],[20.95,32.7],[20.1,32.2],[19.95,31.6],[19.6,30.7],[19,30.3],[18.2,30.65],[17.4,31],[16.4,31.25],[15.4,31.7],[15.1,32.4],[13.2,32.9],[11.5,33.2],[10.2,33.9]];
 const SUDAN=[[36.9,22],[37.25,21],[37.2,20],[37.4,19.1],[37.9,18.4],[38.5,17.6],[38.9,16.7],[39.5,15.8],[40.3,15.2],[41.4,14.4],[42.4,13.5],[43.1,12.7],[43.4,12],[44.5,10.6]];
 const ARABIA=[[43.45,12.65],[43.25,13.3],[42.95,14.8],[42.7,15.7],[42.55,16.9],[41.8,17.9],[41.05,19.1],[40.3,20.15],[39.6,21],[39.15,21.5],[39,22.8],[38.5,23.5],[38.05,24.1],[37.25,25.05],[36.45,26.2],[35.7,27.35],[35.2,28],[34.62,28.1],[34.78,28.6],[34.88,29],[34.98,29.4],[35,29.53]];
 const LEVANT=[[34.25,31.3],[34.5,31.6],[34.75,32.1],[34.95,32.8],[35.1,33.1],[35.5,33.9],[35.95,34.6],[35.85,35.4],[35.9,36.3],[36.2,36.6],[35.6,36.7],[34.6,36.8],[33.5,36.15],[32.6,36.1],[31.5,36.8],[30.6,36.85],[29.6,36.2],[28.2,36.75],[27.3,37.4],[26.8,38.4],[26.3,39.4],[26.2,40.6]];
 const CYPRUS=[[32.3,35.05],[32.9,35.4],[33.6,35.35],[34.6,35.7],[34.1,35.3],[33.9,34.95],[33,34.6],[32.4,34.75]];
 const CRETE=[[23.55,35.3],[24.3,35.36],[25.1,35.35],[26.3,35.25],[26.2,35],[25,34.98],[24.1,35.07],[23.55,35.25]];
 const AFRICA=[[32.55,29.95],[32.3,31.25],[29.9,31.2],...LIBYA,[6,34],[6,4],[50,4],[50,10.8],...SUDAN.slice().reverse(),[34.9,25.5],[33.8,27.25],[33.4,28.1],[32.6,29.5]];
 const ASIA=[[34.9,29.5],...LEVANT,[26.2,46],[62,46],[62,12.6],[45,12.8],...ARABIA,[34.95,29.55]];
 const NEIGHBOURS=[AFRICA,ASIA,CYPRUS,CRETE];
 const NB_COASTS=[LIBYA,SUDAN,ARABIA,LEVANT,[...CYPRUS,CYPRUS[0]],[...CRETE,CRETE[0]]];
 /* Lake Nasser centre line (High Dam → Sudan) and its continuation (Lake Nubia) */
 const LAKE=[[32.88,23.98],[32.83,23.86],[32.73,23.63],[32.57,23.42],[32.42,23.26],[32.2,23.06],[31.96,22.78],[31.76,22.52],[31.64,22.34],[31.48,22.13],[31.36,22]];
 const NUBIA=[[31.36,22],[31.22,21.65],[31.0,21.25],[30.8,20.85]];
 const DELTA=[[31.18,30.15],[30.95,30.35],[30.65,30.6],[30.3,30.85],[30.05,31.0],[29.85,31.12],[29.9,31.3],[30.6,31.32],[31.3,31.34],[32,31.34],[32.28,31.32],[32.22,31.05],[31.95,30.8],[31.7,30.6],[31.45,30.4]];
 const GSS=[[25.05,29.1],[26.1,29.25],[27,28.6],[27.5,27.2],[27.3,25.6],[26.6,24.6],[25.05,24.6]];   // Great Sand Sea
 const QATTARA=[[25.9,29.72],[26.35,29.95],[26.9,30.0],[27.45,29.93],[27.9,29.98],[28.45,29.83],[28.95,29.58],[28.7,29.4],[28.2,29.33],[27.7,29.18],[27.1,29.22],[26.55,29.17],[26.15,29.38]];
 const GILF=[[25.35,23.95],[25.9,24.05],[26.35,23.7],[26.55,23.1],[26.2,22.75],[25.7,22.85],[25.4,23.3]];
 const RSH=[[32.45,29.45],[32.72,28.62],[33.0,27.8],[33.35,27.0],[33.75,26.2],[34.2,25.3],[34.7,24.5],[35.2,23.62],[35.7,22.82],[36.08,22.2]]; // Red Sea Hills spine
 const WADIS=[
  [[32.73,26.17],[32.76,26.6],[32.7,27.1],[32.62,27.6],[32.55,28.05]],   // Wadi Qena
  [[32.82,26.0],[33.2,25.95],[33.6,26.05],[34.0,26.08],[34.27,26.1]],    // Wadi Hammamat
  [[32.9,24.98],[33.4,25.0],[34.0,25.05],[34.6,25.07],[35.1,25.07]],     // Wadi Abbad
  [[32.62,22.75],[33.2,22.62],[33.9,22.45],[34.6,22.35],[35.2,22.25]],   // Wadi Allaqi
  [[31.3,29.05],[31.7,29.0],[32.1,28.95],[32.5,29.05]],                  // Wadi Araba
  [[34.05,29.35],[33.95,29.85],[33.85,30.4],[33.8,31.1]]                 // Wadi el-Arish
 ];
 const OASES=[ // lon, lat, rx, ry (deg), rotation
  [25.52,29.2,.32,.07,0],[28.88,28.35,.13,.1,.3],[27.97,27.06,.08,.1,0],[28.98,25.52,.34,.07,-.12],
  [30.55,25.35,.06,.32,.08],[30.86,29.3,.27,.19,0],[30.33,30.38,.07,.04,.5],[25.0,22.15,.06,.05,0]
 ];
 const WATERS=[ // lakes: lon, lat, rx, ry, rotation
  [30.6,29.47,.19,.035,-.18],[30.38,29.2,.07,.035,.4],[25.33,29.22,.1,.025,0],[25.78,29.17,.08,.022,0], // Qarun, Rayan, Siwa salt lakes
  [32.4,30.35,.07,.12,.35],[32.29,30.57,.03,.02,0],[29.93,31.12,.12,.03,.2],[31.97,31.16,.22,.06,-.2],[30.85,31.17,.22,.035,0] // Bitter, Timsah, Mariout, Manzala, Burullus
 ];
 /* Bir Tawil: unclaimed land south of the 22°N border (claimed by neither Egypt nor Sudan).
    North edge on 22°N (~95 km), south edge ~46 km; centre ≈ 21.87°N 33.75°E, ~2,060 km². */
 const BIR_TAWIL=[[33.25,22.0],[34.12,22.0],[34.0,21.69],[33.55,21.71]];
 const SUEZ=[[32.3,31.25],[32.31,30.95],[32.27,30.6],[32.36,30.4],[32.45,30.25],[32.55,29.97]];
 const BAHR_YUSUF=[[30.85,27.55],[30.72,28.05],[30.8,28.6],[30.95,29.08],[30.86,29.3]];
 const REGIONS=[ // soft tonal variation: lon, lat, radius°, palette key, alpha
  [25.95,26.9,2.4,"sandHi",.6],[29.2,22.6,1.7,"sandHi",.35],[28.4,26.2,2.6,"sandLo",.2],[33.6,25.8,2.5,"rock",.3],
  [32.9,28.4,1.2,"rock",.22],[33.9,28.65,.95,"rockLo",.38],[33.5,30.85,.9,"sandHi",.5],[33.7,29.6,.8,"sandLo",.2],
  [27.3,29.65,1.3,"sandSh",.22],[26.0,23.3,.9,"rockLo",.3],[29.7,30.6,.9,"sandHi",.25]
 ];
 const CITIES=[[31.24,30.05,1],[31.15,30.0,.6],[29.92,31.2,.75],[32.3,31.25,.4],[32.27,30.6,.3],[32.55,29.97,.35],[31.0,30.79,.4],[31.38,31.04,.4],[31.5,30.58,.3],[30.47,31.03,.3],
  [30.84,29.31,.32],[31.1,29.07,.3],[30.75,28.1,.32],[31.18,27.18,.32],[31.69,26.56,.28],[32.72,26.16,.25],[32.64,25.69,.32],[32.9,24.09,.3],[33.81,27.26,.32],[34.33,27.91,.28],[27.24,31.35,.22],[25.52,29.2,.15]];

 /* ---------- precomputed decoration (deterministic, in geo space) ---------- */
 let DECO=null;
 function deco(){if(DECO)return DECO;const t0=performance.now(),r=rng(2026),D={};
  const inLand=(lo,la)=>inEgypt(lo,la);
  /* coastline with a gentle natural wobble; borders stay straight */
  D.ring=[];D.coasts=[];D.borders=[];
  for(let i=0;i<OUT.length;i++){const a=OUT[i],b=OUT[(i+1)%OUT.length],isB=BORDER_EDGES.has(i),len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   const n=isB?1:Math.max(2,Math.round(len/.05)),nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len,ph=[r()*6.3,r()*6.3,r()*6.3],seg=[];
   for(let j=0;j<n;j++){const t=j/n,u=t*len,tap=isB?0:Math.pow(Math.sin(Math.PI*t),.7),off=tap*(.022*Math.sin(u*4.2+ph[0])+.012*Math.sin(u*9.5+ph[1])+.005*Math.sin(u*19+ph[2]));
    seg.push([a[0]+(b[0]-a[0])*t+nx*off,a[1]+(b[1]-a[1])*t+ny*off])}
   D.ring.push(...seg);(isB?D.borders:D.coasts).push([...seg,b])}
  D.barchan=[];for(let g=0;D.barchan.length<70&&g<3000;g++){const lo=29.6+r()*.75,la=24.6+r()*1.6;if(inLand(lo,la)&&!pip(GSS,lo,la))D.barchan.push([lo,la,.025+r()*.03])}
  for(let g=0;g<400&&D.barchan.length<120;g++){const lo=32.6+r()*1.6,la=30.5+r()*.62;if(inLand(lo,la)&&polyDist(SUEZ,lo,la)>.15)D.barchan.push([lo,la,.025+r()*.03])}
  const along=(pts,t)=>{const f=t*(pts.length-1),i=Math.min(pts.length-2,Math.floor(f)),k=f-i,a=pts[i],b=pts[i+1];return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,b[0]-a[0],b[1]-a[1]]};
  /* wadi tributaries */
  D.wadis=[];for(const w of WADIS){D.wadis.push(w);for(let j=0;j<7;j++){const[x,y,dx,dy]=along(w,.08+r()*.84),l=Math.hypot(dx,dy),side=r()<.5?-1:1,ang=Math.atan2(dy,dx)+side*(.6+r()*.5),L=.12+r()*.25;
   D.wadis.push([[x,y],[x+Math.cos(ang)*L*.5+(r()-.5)*.04,y+Math.sin(ang)*L*.5+(r()-.5)*.04],[x+Math.cos(ang)*L,y+Math.sin(ang)*L]])}}
  /* oases as clusters of soft blobs */
  D.oases=OASES.map(([lo,la,rx,ry,rot])=>{const b=[[0,0,1,1]];for(let j=0;j<5;j++)b.push([(r()-.5)*1.2,(r()-.5)*1.2,.35+r()*.4,.35+r()*.4]);
   const dots=[];for(let j=0;j<Math.round(30+rx*ry*4000);j++){const a=r()*6.3,d=Math.sqrt(r())*.95;dots.push([Math.cos(a)*d,Math.sin(a)*d,.6+r()*.8])}return{lo,la,rx,ry,rot,b,dots}});
  /* White Desert chalk & Black Desert basalt specks */
  D.chalk=[];for(let j=0;j<55;j++)D.chalk.push([27.85+r()*.45,27.22+r()*.35,.008+r()*.018]);
  D.basalt=[];for(let j=0;j<40;j++)D.basalt.push([28.45+r()*.35,27.75+r()*.35,.006+r()*.012]);
  /* Delta field mosaic & canals */
  D.fields=[];for(let g=0;D.fields.length<300&&g<3000;g++){const lo=29.9+r()*2.4,la=30.15+r()*1.15;if(pip(DELTA,lo,la)&&inLand(lo,la))D.fields.push([lo,la,.025+r()*.035,.018+r()*.03,(r()-.5)*.8,r()<.5])}
  D.canals=[];for(let j=0;j<10;j++){const ex=30.0+j/9*2.2,ey=31.2+.03*Math.sin(j*1.7);D.canals.push([[31.18,30.15],[31.18+(ex-31.18)*.45+(r()-.5)*.15,30.15+(ey-30.15)*.5],[ex,ey]])}
  /* Lake Nasser khors (side inlets) */
  D.khors=[];for(let j=0;j<16;j++){const[x,y,dx,dy]=along(LAKE,.05+r()*.88),side=r()<.5?-1:1,base=Math.atan2(dy,dx)+(r()<.5?0:Math.PI),ang=base+side*(.35+r()*.55),L=.08+r()*.18,bend=side*(r()*.5+.15);
   D.khors.push({w:.014+r()*.018,p:[[x,y],[x+Math.cos(ang)*L*.4,y+Math.sin(ang)*L*.4],[x+Math.cos(ang+bend*.6)*L*.75,y+Math.sin(ang+bend*.6)*L*.75],[x+Math.cos(ang+bend)*L,y+Math.sin(ang+bend)*L]]})}
  /* sea glints (live animation), only over water */
  D.glints=[];for(let g=0;D.glints.length<110&&g<6000;g++){const lo=22+r()*17,la=19+r()*16;
   if(inLand(lo,la)||NEIGHBOURS.some(p=>pip(p,lo,la)))continue;if(polyDist(D.ring,lo,la)<.25)continue;D.glints.push([lo,la,5+r()*10,r()*6.3,.6+r()*.8])}
  /* night-time city lights (night theme only) */
  D.lights=CITIES.slice();for(let g=0;g<200&&D.lights.length<95;g++){const lo=29.9+r()*2.4,la=30.1+r()*1.1;if(pip(DELTA,lo,la)&&inLand(lo,la))D.lights.push([lo,la,.08+r()*.12])}
  for(let j=0;j<34;j++){const f=.12+r()*.83,i=Math.floor(f*(NILE.length-1)),a=NILE[i],b=NILE[i+1]||a,k=f*(NILE.length-1)-i;D.lights.push([a[0]+(b[0]-a[0])*k+(r()-.5)*.12,a[1]+(b[1]-a[1])*k,.06+r()*.1])}
  stats.decoMs=Math.round(performance.now()-t0);return DECO=D}

 /* ---------- shaded relief (procedural height fields, lit from the north-west) ----------
    Two height fields are computed once in geographic space:
      COUNTRY  – whole of Egypt at ~72 px/°: desert undulation, seif dunes of the Great Sand Sea,
                 the Abu Muharik dune belt, the oasis depressions (Qattara, Siwa, Bahariya, Farafra,
                 Dakhla, Kharga, Fayoum), the Gilf Kebir plateau, Gebel Uweinat, and the Nile valley
                 cut into the plateau.
      MOUNTAIN – Red Sea Hills, South Sinai, the Galala plateaus and Gebel Elba at ~150 px/°.
    They are coloured per theme and drawn (geo-locked) by the painter. Generation is spread over
    several frames so start-up never stalls; the map simply gains its relief a moment later. */
 const hash=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
 const vn=(x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),tx=x-x0,ty=y-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),a=hash(x0,y0),b=hash(x0+1,y0),c=hash(x0,y0+1),d=hash(x0+1,y0+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy};
 const fbm=(x,y,o)=>{let v=0,a=.5,f=1;for(let i=0;i<o;i++){v+=a*vn(x*f+i*17.3,y*f-i*9.1);a*=.5;f*=2.02}return v};
 const ridged=(x,y,o)=>{let v=0,a=.6,f=1;for(let i=0;i<o;i++){const n=1-Math.abs(vn(x*f+i*31.7,y*f+i*11.3)*2-1);v+=a*n*n;a*=.5;f*=2.03}return v};
 const ss=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t)};
 const ell=(lo,la,cx,cy,rx,ry,rot)=>{const c=Math.cos(rot||0),s=Math.sin(rot||0),dx=lo-cx,dy=la-cy,u=(dx*c+dy*s)/rx,v=(-dx*s+dy*c)/ry;return Math.sqrt(u*u+v*v)};
 const DEPRESSIONS=[[27.3,29.6,1.45,.38,-.05,.6],[25.55,29.2,.55,.12,0,.35],[28.88,28.3,.42,.36,0,.42],[27.97,27.05,.42,.42,0,.3],[29.0,25.55,.6,.17,-.1,.38],[30.55,25.3,.18,.62,.08,.45],[30.75,29.35,.33,.25,0,.33]];
 const SPINE=RSH,AM_BELT=[[28.55,29.8],[28.95,28.9],[29.35,27.9],[29.75,26.9],[30.05,26.0],[30.2,25.35]];
 /* irregular ellipse distance: noise-warped so basins and massifs never look geometric */
 const wEll=(lo,la,cx,cy,rx,ry,rot,amp)=>ell(lo,la,cx,cy,rx,ry,rot)*(1+amp*(fbm(lo*2.6+cx*3,la*2.6-cy*3,3)-.5));
 let NILE_VALLEY=null;
 /* Each field: smooth(lo,la) → channels computed on a coarse grid (cheap, interpolated);
                detail(lo,la,c) → final height at full resolution. */
 const FIELDS={
  country:{b:[24.8,21.8,37.2,31.9],ppd:46,z:6,gh:1.6,gl:1.4,
   smooth(lo,la){let h=.38*fbm(lo*1.7,la*1.7,4);
    h+=.7*Math.exp(-((lo-25.05)**2+(la-22.0)**2)/.02);                                         // Gebel Uweinat
    h+=.45*Math.exp(-(polyDist(SPINE,lo,la)**2)/.5);                                            // Eastern Desert uplift
    h+=.5*Math.exp(-((lo-33.92)**2+(la-28.6)**2)/.35);                                         // Sinai dome
    h-=.3*Math.exp(-((polyDist(NILE_VALLEY,lo,la)/.17)**2));                                    // Nile valley cut into the plateau
    return[h,1-ss(.8,1.25,ell(lo,la,26.0,27.0,1.35,2.55,.05)),1-ss(.05,.17,polyDist(AM_BELT,lo,la)),fbm(lo*2.6,la*2.6,3)-.5]},
   detail(lo,la,c){const ca=Math.cos(.24),sa=Math.sin(.24),u=lo*ca+la*sa,w=-lo*sa+la*ca,wp=1+.6*c[3];let h=c[0]+.1*fbm(lo*6.5,la*6.5,3);
    for(const[cx,cy,rx,ry,rot,dp]of DEPRESSIONS){const e=ell(lo,la,cx,cy,rx,ry,rot)*wp;if(e<1.15)h-=dp*(1-ss(.62,1.08,e))}           // oasis depressions, irregular rims
    {const e=ell(lo,la,25.95,23.4,.62,.66,.3)*(1+.7*c[3]);if(e<1.1)h+=(1-ss(.78,1.02,e))*.5*(.85+.3*fbm(lo*9,la*9,2))}           // Gilf Kebir plateau
    if(c[1]>.01)h+=c[1]*.11*ridged(u*13,w*1.2,3);if(c[2]>.01)h+=c[2]*.09*ridged(u*16,w*1.4,2);return h}},
  mountain:{b:[31.9,21.8,36.7,30.1],ppd:100,z:12,gh:1.25,gl:1.35,mask:true,
   smooth(lo,la){const n=fbm(lo*2.4+5,la*2.4-3,3)-.5,bw=.42+.18*(fbm(lo*.9,la*.9,2)-.5);
    return[Math.max(1-ss(bw*.35,bw,polyDist(SPINE,lo,la)+.35*n),1-ss(.35,.95,wEll(lo,la,33.92,28.62,.7,.62,.2,.8)),1-ss(.35,1,wEll(lo,la,36.25,22.25,.32,.27,0,.8)),
     1-ss(.45,1,wEll(lo,la,32.35,29.05,.3,.22,.3,.8)),1-ss(.45,1,wEll(lo,la,32.75,28.75,.26,.18,0,.8)))]},
   detail(lo,la,c){const m=c[0];if(m<=.002)return 0;const ca=Math.cos(1.1),sa=Math.sin(1.1),u=lo*ca+la*sa,w=-lo*sa+la*ca;return m*(.62*ridged(u*4.5,w*8,5)+.28*fbm(lo*14,la*14,3))+m*.35}}};
 const RELIEF={ready:false,masks:{},tint:{}};let reliefJob=null;const RELIEF_VER="relief-v1";
 /* Build the relief in small time slices (≤12 ms each) so the game never stalls:
      1. coarse grid of smooth channels   2. full-res heights (separable Catmull-Rom of the grid + detail noise)
      3. three theme-independent alpha masks per field: light (NW slopes), shade (SE slopes), rock tint.
    The masks are cached in IndexedDB, so later launches skip all of this. */
 function startRelief(sync){if(RELIEF.ready||(reliefJob&&!sync))return;if(reliefJob&&reliefJob!==1)clearTimeout(reliefJob);
  const tStart=performance.now(),finish=()=>{RELIEF.ready=true;reliefJob=null;envKey="";stats.reliefMs=Math.round(performance.now()-tStart)};
  if(!sync&&!startRelief.triedCache){startRelief.triedCache=true;reliefJob=1;
   cacheLoad().then(ok=>{if(RELIEF.ready)return;if(ok){finish();stats.reliefCached=true}else{reliefJob=null;startRelief()}});return}
  NILE_VALLEY=NILE.filter(q=>q[1]>=23.97&&q[1]<=30.25);
  const G=6,cr=(p0,p1,p2,p3,t)=>p1+.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)));
  const jobs=Object.entries(FIELDS).map(([name,f])=>{const w=Math.round((f.b[2]-f.b[0])*f.ppd),h=Math.round((f.b[3]-f.b[1])*f.ppd),cw=Math.ceil(w/G)+3,chh=Math.ceil(h/G)+3;
   return{name,f,w,h,cw,chh,H:new Float32Array(w*h),M:f.mask?new Float32Array(w*h):null,S:null,nc:0,sy:0,y:0,ty:1}});
  const geo=(f,x,y)=>[f.b[0]+(x+.5)/f.ppd,f.b[3]-(y+.5)/f.ppd];
  let ji=0;const step=()=>{const t0=performance.now();
   while(ji<jobs.length&&(sync||performance.now()-t0<12)){const j=jobs[ji],f=j.f;
    if(j.sy<j.chh){ /* 1 · coarse grid (one node every G px, plus one ring around for the spline) */
     for(;j.sy<j.chh&&(sync||performance.now()-t0<12);j.sy++)for(let x=0;x<j.cw;x++){const[lo,la]=geo(f,(x-1)*G,(j.sy-1)*G),v=f.smooth(lo,la);if(!j.S){j.nc=v.length;j.S=new Float32Array(j.cw*j.chh*j.nc)}j.S.set(v,(j.sy*j.cw+x)*j.nc)}continue}
    if(j.y<j.h){ /* 2 · full-resolution heights: vertical spline per grid column, then horizontal per pixel */
     const nc=j.nc,R=new Float32Array(j.cw*nc),c=new Array(nc),S=j.S,cw=j.cw;
     for(;j.y<j.h&&(sync||performance.now()-t0<12);j.y++){const gy=j.y/G+1,y0=Math.floor(gy),ty=gy-y0,r0=Math.max(0,y0-1),r3=Math.min(j.chh-1,y0+2);
      for(let x=0;x<cw;x++)for(let q=0;q<nc;q++)R[x*nc+q]=cr(S[(r0*cw+x)*nc+q],S[(y0*cw+x)*nc+q],S[((y0+1)*cw+x)*nc+q],S[(r3*cw+x)*nc+q],ty);
      for(let x=0;x<j.w;x++){const gx=x/G+1,x0=Math.floor(gx),tx=gx-x0,b=x0*nc;
       for(let q=0;q<nc;q++)c[q]=cr(R[b-nc+q],R[b+q],R[b+nc+q],R[b+2*nc+q],tx);
       const[lo,la]=geo(f,x,j.y),i=j.y*j.w+x;j.H[i]=f.detail(lo,la,c);if(j.M)j.M[i]=Math.max(0,c[0])}}continue}
    if(j.ty<j.h-1){ /* 3 · shade masks (light / shadow / tint) straight into pixel buffers */
     if(!j.L){j.L=new ImageData(j.w,j.h);j.D=new ImageData(j.w,j.h);if(j.M)j.T=new ImageData(j.w,j.h)}
     const{w,H,M}=j,Lx=.62,Ly=.62,Lz=.48;
     for(;j.ty<j.h-1&&(sync||performance.now()-t0<12);j.ty++){const y=j.ty;for(let x=1;x<w-1;x++){const i=y*w+x,dzdx=(H[i+1]-H[i-1])*f.z,dzdy=(H[i+w]-H[i-w])*f.z,
       d=(Lx*dzdx+Ly*dzdy+Lz)/Math.sqrt(dzdx*dzdx+dzdy*dzdy+1)-Lz, // raster y points south: rising E or S = facing the NW light
       m=M?Math.min(1,M[i]*2.2):1,q=i*4+3;
       if(d>0)j.L.data[q]=Math.min(.72,d*f.gh)*m*255;else j.D.data[q]=Math.min(.82,-d*f.gl)*m*255;if(M)j.T.data[q]=m*.42*255}}continue}
    RELIEF.masks[j.name]=["L","D","T"].map(k=>{if(!j[k])return null;const c=document.createElement("canvas");c.width=j.w;c.height=j.h;c.getContext("2d").putImageData(j[k],0,0);return c});
    j.H=j.M=j.S=j.L=j.D=j.T=null;ji++}
   if(ji<jobs.length)reliefJob=setTimeout(step,0);else{finish();cacheSave()}};
  if(sync)step();else reliefJob=setTimeout(step,30)}
 /* IndexedDB cache of the masks (PNG blobs). Any failure → the relief is simply regenerated. */
 const idb=()=>new Promise((res,rej)=>{try{const r=indexedDB.open("egyptquest-art",1);r.onupgradeneeded=()=>r.result.createObjectStore("k");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});
 async function cacheSave(){try{const db=await idb(),items=[];for(const name in RELIEF.masks)for(let i=0;i<3;i++){const c=RELIEF.masks[name][i];if(c)items.push([name+i,await new Promise(r=>c.toBlob(r,"image/png"))])}
  const tx=db.transaction("k","readwrite"),st=tx.objectStore("k");for(const[k,b]of items)st.put(b,k);st.put(RELIEF_VER,"ver")}catch(e){stats.cacheErr=String(e)}}
 async function cacheLoad(){try{const db=await idb(),get=k=>new Promise(r=>{const q=db.transaction("k").objectStore("k").get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});
  if(await get("ver")!==RELIEF_VER)return false;const out={};
  for(const name in FIELDS){out[name]=[];for(let i=0;i<3;i++){const b=await get(name+i);if(!b){out[name].push(null);continue}
    const bm=await createImageBitmap(b),c=document.createElement("canvas");c.width=bm.width;c.height=bm.height;c.getContext("2d").drawImage(bm,0,0);out[name].push(c)}
   if(!out[name][0]||!out[name][1])return false}
  RELIEF.masks=out;return true}catch(e){return false}}
 /* colour a field's masks for the current theme and merge them into ONE image (canvas compositing, made once per theme) */
 function shaded(name){const C=pal(),mt=name==="mountain",key=name+"|"+theme;if(RELIEF.tint[key])return RELIEF.tint[key];const ms=RELIEF.masks[name];if(!ms)return null;
  const w=ms[0].width,h=ms[0].height,out=document.createElement("canvas");out.width=w;out.height=h;const go=out.getContext("2d"),tmp=document.createElement("canvas");tmp.width=w;tmp.height=h;const gt=tmp.getContext("2d");
  for(const[i,col]of[[2,C.rock],[1,mt?C.rockLo:C.sandSh],[0,mt?C.rockHi:C.sandHi]]){if(!ms[i])continue;gt.globalCompositeOperation="copy";gt.drawImage(ms[i],0,0);gt.globalCompositeOperation="source-in";gt.fillStyle=col;gt.fillRect(0,0,w,h);go.drawImage(tmp,0,0)}
  return RELIEF.tint[key]=out}
 function drawRelief(g,P,name){if(!RELIEF.ready)return;const c=shaded(name);if(!c)return;const f=FIELDS[name],[x0,y0]=P(f.b[0],f.b[3]),[x1,y1]=P(f.b[2],f.b[1]);g.drawImage(c,x0,y0,x1-x0,y1-y0)}

 /* ---------- texture tiles (made once) ---------- */
 let GRAIN=null,MOTTLE=null;
 function tiles(){if(GRAIN)return;const tt=performance.now(),r=rng(7);
  const a=document.createElement("canvas");a.width=a.height=160;const ga=a.getContext("2d"),im=ga.createImageData(160,160);
  for(let i=0;i<im.data.length;i+=4){const v=165+r()*90|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}ga.putImageData(im,0,0);GRAIN=a;
  /* soft, seamless mottling: multi-octave value noise on a wrapping lattice (smooth, tileable) */
  const M=128,m=document.createElement("canvas");m.width=m.height=M;const gm=m.getContext("2d"),mi=gm.createImageData(M,M),acc=new Float32Array(M*M);
  for(const[n,a]of[[4,.55],[8,.28],[16,.17]]){const L=new Float32Array(n*n);for(let q=0;q<n*n;q++)L[q]=r();const cell=M/n;
   for(let y=0;y<M;y++){const fy=y/cell,y0=Math.floor(fy),t=fy-y0,sy=t*t*(3-2*t),ya=(y0%n)*n,yb=((y0+1)%n)*n;
    for(let x=0;x<M;x++){const fx=x/cell,x0=Math.floor(fx),u=fx-x0,sx=u*u*(3-2*u),xa=x0%n,xb=(x0+1)%n;
     acc[y*M+x]+=a*((L[ya+xa]*(1-sx)+L[ya+xb]*sx)*(1-sy)+(L[yb+xa]*(1-sx)+L[yb+xb]*sx)*sy)}}}
  for(let q=0;q<M*M;q++){const c=Math.max(0,Math.min(255,(acc[q]-.5)*1.9*255+128))|0;mi.data[q*4]=mi.data[q*4+1]=mi.data[q*4+2]=c;mi.data[q*4+3]=255}
  gm.putImageData(mi,0,0);MOTTLE=m;stats.tilesMs=Math.round(performance.now()-tt)}
 function patFill(g,img,mode,alpha,scale,ox,oy){const p=g.createPattern(img,"repeat");if(p.setTransform)p.setTransform(new DOMMatrix([scale,0,0,scale,ox,oy]));
  g.save();g.globalCompositeOperation=mode;g.globalAlpha=alpha;g.fillStyle=p;g.fillRect(0,0,g.canvas.width,g.canvas.height);g.restore()}

 /* ---------- the painter ---------- */
 function paint(g,v){tiles();const D=deco(),C=pal(),P=mkP(v),k=v.s*v.z*v.d,Wc=g.canvas.width,Hc=g.canvas.height,LW=(min,deg)=>Math.max(min*v.d,deg*k),
  glow=(lo,la,R,col,a)=>{const[x,y]=P(lo,la),rr=R*k,gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,rgba(col,a));gr.addColorStop(1,rgba(col,0));g.fillStyle=gr;g.beginPath();g.arc(x,y,rr,0,7);g.fill()},
  stroke=(pts,col,w,smooth)=>{g.beginPath();smooth?spath(g,P,pts):path(g,P,pts);g.strokeStyle=col;g.lineWidth=w;g.stroke()};
  const anchor=P(31,26.9);g.lineCap="round";g.lineJoin="round";

  /* 1 ── open sea: deep navy, lighter body of water around Egypt */
  g.fillStyle=C.seaDeep;g.fillRect(0,0,Wc,Hc);glow(31.8,27.6,11,C.seaMid,1);

  /* 2 ── continental shelves & reefs: soft turquoise halos along every coast */
  const shelf=(lines,closed)=>{for(const[w,a,col]of[[.55,.13,C.shelf],[.3,.18,C.shelf],[.13,.3,C.reef]]){g.beginPath();for(const l of lines)path(g,P,l,closed);g.strokeStyle=rgba(col,a);g.lineWidth=w*k;g.stroke()}};
  shelf(D.coasts);shelf(NB_COASTS);

  /* 3 ── neighbouring lands, muted (Libya, Sudan, Levant, Arabia, Cyprus, Crete) */
  g.save();g.beginPath();for(const p of NEIGHBOURS)path(g,P,p,true);g.fillStyle=C.nb;g.fill();g.clip();
  patFill(g,MOTTLE,"soft-light",.16,k/22,anchor[0],anchor[1]);
  g.beginPath();spath(g,P,NUBIA);g.strokeStyle=rgba(C.water,.8);g.lineWidth=LW(2,.08);g.stroke();
  g.restore();
  g.beginPath();for(const l of NB_COASTS)path(g,P,l);g.strokeStyle=rgba(C.nbEdge,.55);g.lineWidth=LW(.8,.008);g.stroke();

  /* 4 ── atmospheric fog: everything far from Egypt sinks into the navy theme */
  {const[cx,cy]=P(30.6,26.9),fg=g.createRadialGradient(cx,cy,6.2*k,cx,cy,13*k);fg.addColorStop(0,"rgba("+C.fog+",.08)");fg.addColorStop(.5,"rgba("+C.fog+",.58)");fg.addColorStop(1,"rgba("+C.fog+",.9)");g.fillStyle=fg;g.fillRect(0,0,Wc,Hc)}

  /* 5 ── graticule: fine gold meridians/parallels every 2° (under the land) */
  g.beginPath();for(let lo=14;lo<=48;lo+=2)path(g,P,[[lo,6],[lo,46]]);for(let la=6;la<=46;la+=2)path(g,P,[[6,la],[56,la]]);
  g.strokeStyle=rgba(C.gold,.075);g.lineWidth=Math.max(1,.7*v.d);g.stroke();

  /* 6 ── Egypt: soft drop shadow (light from the north-west), then the land */
  g.save();g.translate(k*.04,k*.07);for(const[w,a]of[[.55,.1],[.34,.12],[.18,.15],[.07,.2]]){g.beginPath();path(g,P,D.ring,true);g.strokeStyle="rgba("+C.fog+","+a+")";g.lineWidth=w*k;g.stroke()}
  g.beginPath();path(g,P,D.ring,true);g.fillStyle="rgba("+C.fog+",.4)";g.fill();g.restore();
  g.beginPath();path(g,P,D.ring,true);{const y0=P(31,31.7)[1],y1=P(31,22)[1],lg=g.createLinearGradient(0,y0,0,y1);lg.addColorStop(0,C.sandHi);lg.addColorStop(.45,C.sand);lg.addColorStop(1,C.sandLo);g.fillStyle=lg}g.fill();

  g.save();g.beginPath();path(g,P,D.ring,true);g.clip();
  /* 6a regional tones: Great Sand Sea, Eastern Desert rock, Sinai granite… */
  for(const[lo,la,R,key,a]of REGIONS)glow(lo,la,R,C[key],a);
  /* 6b sand texture: large mottling + fine grain, locked to the map */
  patFill(g,MOTTLE,"soft-light",.5,k/20,anchor[0],anchor[1]);
  patFill(g,GRAIN,"multiply",.16,v.d*Math.sqrt(v.z),anchor[0],anchor[1]);
  /* 6c shaded relief of the whole country: dunes, depressions, plateaus, the Nile valley */
  drawRelief(g,P,"country");
  /* 6d Qattara salt pans and the Siwa salt flats */
  for(const[lo,la,rx,ry,rot]of[[26.45,29.58,.13,.035,-.3],[26.7,29.5,.07,.03,.4],[27.25,29.45,.2,.05,-.15],[27.6,29.52,.08,.025,.2],[28.15,29.52,.12,.03,-.4],[28.4,29.6,.05,.02,0]]){const[x,y]=P(lo,la);g.beginPath();g.ellipse(x,y,rx*k,ry*k,rot,0,7);g.fillStyle=rgba(C.salt,.42);g.fill()}
  /* 6e barchan dunes: a few crescent fields (west of Kharga, North Sinai) — only when zoomed enough to read */
  if(k>70){const sl=new Path2D(),lit=new Path2D();for(const[lo,la,sz]of D.barchan){const[x,y]=P(lo,la),R=sz*k;if(R<2.2||x<-R||y<-R||x>Wc+R||y>Hc+R)continue;
    lit.moveTo(x-R,y);lit.quadraticCurveTo(x,y-R*1.1,x+R,y);lit.quadraticCurveTo(x+R*.35,y-R*.1,x+R*.6,y+R*.55);lit.quadraticCurveTo(x,y-R*.15,x-R*.6,y+R*.55);lit.quadraticCurveTo(x-R*.35,y-R*.1,x-R,y);
    sl.moveTo(x+R*.6,y+R*.55);sl.quadraticCurveTo(x,y-R*.15,x-R*.6,y+R*.55);sl.quadraticCurveTo(x,y+R*.15,x+R*.6,y+R*.55)}
   g.fillStyle=rgba(C.sandHi,.55);g.fill(lit);g.fillStyle=rgba(C.sandSh,.42);g.fill(sl)}
  /* 6f mountains: shaded relief of the Red Sea Hills, South Sinai, Galala and Gebel Elba */
  drawRelief(g,P,"mountain");
  /* 6g wadis (dry valleys) */
  {const p=new Path2D();for(const w of D.wadis){const q=w.map(z=>P(z[0],z[1]));p.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length-1;i++)p.quadraticCurveTo(q[i][0],q[i][1],(q[i][0]+q[i+1][0])/2,(q[i][1]+q[i+1][1])/2);p.lineTo(q[q.length-1][0],q[q.length-1][1])}
   g.strokeStyle=rgba(C.sandSh,.28);g.lineWidth=LW(1.6,.03);g.stroke(p);g.strokeStyle=rgba(C.sandHi,.55);g.lineWidth=LW(.8,.014);g.stroke(p)}
  /* 6h oases, White Desert chalk, Black Desert basalt */
  for(const o of D.oases){const[x,y]=P(o.lo,o.la);g.save();g.translate(x,y);g.rotate(o.rot);
   g.fillStyle=rgba(C.veg,.22);for(const[bx,by,sx,sy]of o.b){g.beginPath();g.ellipse(bx*o.rx*k,-by*o.ry*k,Math.max(2*v.d,sx*o.rx*k*1.5),Math.max(1.5*v.d,sy*o.ry*k*1.6),0,0,7);g.fill()}
   g.fillStyle=rgba(C.veg,.8);for(const[bx,by,sx,sy]of o.b){g.beginPath();g.ellipse(bx*o.rx*k*.8,-by*o.ry*k*.8,Math.max(1.4*v.d,sx*o.rx*k),Math.max(1*v.d,sy*o.ry*k),0,0,7);g.fill()}
   if(o.rx*k>10){g.fillStyle=rgba(C.vegLo,.65);g.beginPath();for(const[dx,dy,s]of o.dots){const px=dx*o.rx*k*.85,py=-dy*o.ry*k*.85,rr=Math.max(.5*v.d,s*k*.007);g.moveTo(px+rr,py);g.arc(px,py,rr,0,7)}g.fill()}
   g.restore()}
  {const ch=new Path2D(),bs=new Path2D();for(const[lo,la,s]of D.chalk){const[x,y]=P(lo,la),R=Math.max(.6*v.d,s*k);ch.moveTo(x+R,y);ch.ellipse(x,y,R,R*.7,0,0,7)}for(const[lo,la,s]of D.basalt){const[x,y]=P(lo,la),R=Math.max(.5*v.d,s*k);bs.moveTo(x+R,y);bs.arc(x,y,R,0,7)}
   g.fillStyle=rgba(C.chalk,.8);g.fill(ch);g.fillStyle=rgba(C.rockLo,.55);g.fill(bs)}
  /* 6i the Nile valley and Delta: olive fertile land */
  {const dam=NILE.findIndex(q=>q[1]>=23.97),apex=NILE.findIndex(q=>q[1]>=30.19),val=NILE.slice(dam,apex+1);
   const wAt=la=>la<27?.13:la<29.5?.13+(la-27)*.04:.23;
   for(const[mul,a,col]of[[2.2,.24,C.veg],[1,.9,C.veg],[.4,.5,C.vegLo]])for(let i=0;i<val.length-1;i++){const a1=val[i],b1=val[i+1];g.beginPath();path(g,P,[a1,b1]);g.strokeStyle=rgba(col,a);g.lineWidth=Math.max(mul*4*v.d,wAt((a1[1]+b1[1])/2)*mul*k);g.stroke()}
   const[ax,ay]=P(31.18,30.15),[cx,cy]=P(31.1,31.25),dg=g.createLinearGradient(ax,ay,cx,cy);dg.addColorStop(0,rgba(C.vegLo,.95));dg.addColorStop(1,rgba(C.veg,.9));
   g.beginPath();spath(g,P,[...DELTA,DELTA[0],DELTA[1]]);g.fillStyle=dg;g.fill();g.strokeStyle=rgba(C.veg,.3);g.lineWidth=.1*k;g.stroke();
   if(k>40){const f1=new Path2D(),f2=new Path2D();for(const[lo,la,w,h,rot,alt]of D.fields){const[x,y]=P(lo,la),c=Math.cos(rot),s=Math.sin(rot),W2=w*k/2,H2=h*k/2,p=alt?f1:f2;
     p.moveTo(x-c*W2+s*H2,y-s*W2-c*H2);p.lineTo(x+c*W2+s*H2,y+s*W2-c*H2);p.lineTo(x+c*W2-s*H2,y+s*W2+c*H2);p.lineTo(x-c*W2-s*H2,y-s*W2+c*H2);p.closePath()}
    g.fillStyle=rgba(C.vegHi,.22);g.fill(f1);g.fillStyle=rgba(C.vegLo,.22);g.fill(f2)}
   g.beginPath();for(const c of D.canals)spath(g,P,c);g.strokeStyle=rgba(C.vegLo,.4);g.lineWidth=LW(.6,.006);g.stroke()}
  /* 6j water: Lake Nasser, the Nile and its branches, canals and lakes */
  const wN=Math.min(9*v.d,Math.max(2.6*v.d,.05*k));
  const water=(pts,w,smooth)=>{for(const[col,ww]of[[C.waterLo,w+1.6*v.d],[C.water,w],[rgba(C.waterHi,.5),w*.32]]){g.beginPath();smooth?spath(g,P,pts):path(g,P,pts);g.strokeStyle=col;g.lineWidth=ww;g.stroke()}};
  for(const kh of D.khors)for(let q=0;q<kh.p.length-1;q++){const tw=1-q/(kh.p.length-1)*.75;g.beginPath();path(g,P,[kh.p[q],kh.p[q+1]]);g.strokeStyle=C.water;g.lineWidth=Math.max(.8*v.d,kh.w*k*tw);g.stroke()}
  for(const[col,extra]of[[C.waterLo,1.4*v.d],[C.water,0]]){
   for(let i=0;i<LAKE.length-1;i++){const t=i/(LAKE.length-2),w=(.06+.07*Math.sin(t*Math.PI))*k;g.beginPath();path(g,P,[LAKE[i],LAKE[i+1]]);g.strokeStyle=col;g.lineWidth=Math.max(wN,w)+extra;g.stroke()}}
  g.beginPath();spath(g,P,LAKE);g.strokeStyle=rgba(C.waterHi,.3);g.lineWidth=Math.max(1,.02*k);g.stroke();
  const dam=NILE.findIndex(q=>q[1]>=23.97);
  water(NILE.slice(dam),wN,true);water(ROSETTA,wN*.72,true);water(BAHR_YUSUF,wN*.4,true);water(SUEZ,wN*.5,false);
  for(const[lo,la,rx,ry,rot]of WATERS){const[x,y]=P(lo,la);g.beginPath();g.ellipse(x,y,Math.max(1.5*v.d,rx*k),Math.max(1.2*v.d,ry*k),rot,0,7);g.fillStyle=C.water;g.fill();g.strokeStyle=C.waterLo;g.lineWidth=Math.max(.8,.6*v.d);g.stroke()}
  /* 6k coastal beach rim (inner half of a stroke, thanks to the clip) */
  g.beginPath();path(g,P,D.ring,true);g.strokeStyle=rgba(C.sandHi,.55);g.lineWidth=LW(2.2,.04);g.stroke();
  /* 6l relief light: warm from the north-west, cool shade to the south-east */
  {const[x0,y0]=P(25.5,31.8),[x1,y1]=P(36.5,22),lg=g.createLinearGradient(x0,y0,x1,y1);lg.addColorStop(0,"rgba("+C.light+",.2)");lg.addColorStop(.55,"rgba("+C.light+",0)");lg.addColorStop(1,"rgba("+C.fog+",.3)");
   g.save();g.globalCompositeOperation="soft-light";g.fillStyle=lg;g.fillRect(0,0,Wc,Hc);g.restore()}
  /* 6m night theme: warm city lights along the Nile, Delta and coasts */
  if(C.night){g.save();g.globalCompositeOperation="lighter";for(const[lo,la,s]of D.lights){const[x,y]=P(lo,la),R=Math.max(2.5*v.d,s*.22*k),gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,"rgba(255,214,140,.75)");gr.addColorStop(.35,"rgba(255,190,110,.25)");gr.addColorStop(1,"rgba(255,170,90,0)");g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,7);g.fill()}g.restore()}
  g.restore(); // end land clip

  /* 7 ── coastline: gold edge with a dark ink core; dashed gold land borders */
  g.beginPath();for(const c of D.coasts)path(g,P,c);g.strokeStyle=rgba(C.gold,.5);g.lineWidth=LW(2.4,.02);g.stroke();g.strokeStyle=rgba(C.ink,.75);g.lineWidth=LW(.9,.007);g.stroke();
  g.beginPath();for(const b of D.borders)path(g,P,b);g.setLineDash([5*v.d,4*v.d]);g.strokeStyle=rgba(C.gold,.7);g.lineWidth=1.3*v.d;g.stroke();g.setLineDash([]);
  /* 7b ── Bir Tawil: neutral sand with fine gold hatching and a dashed outline (not part of Egypt's land) */
  g.save();g.beginPath();path(g,P,BIR_TAWIL,true);g.fillStyle=rgba(C.sand,.6);g.fill();g.clip();
  {const[x0,y0]=P(33.2,22.05),[x1,y1]=P(34.2,21.6),step=Math.max(4*v.d,.035*k);g.beginPath();for(let x=x0-(y1-y0);x<x1;x+=step){g.moveTo(x,y0);g.lineTo(x+(y1-y0),y1)}g.strokeStyle=rgba(C.gold,.45);g.lineWidth=Math.max(.8,.6*v.d);g.stroke()}
  g.restore();g.beginPath();path(g,P,BIR_TAWIL,true);g.setLineDash([4*v.d,3*v.d]);g.strokeStyle=rgba(C.gold,.85);g.lineWidth=1.2*v.d;g.stroke();g.setLineDash([]);
  /* 8 ── Tropic of Cancer: a faint dashed gold parallel */
  g.beginPath();path(g,P,[[10,23.44],[50,23.44]]);g.setLineDash([10*v.d,8*v.d]);g.strokeStyle=rgba(C.gold,.2);g.lineWidth=v.d;g.stroke();g.setLineDash([])}

 /* ---------- caches ---------- */
 let envKey="",home=null,view=null,lastMV={z:-1,ox:0,oy:0},movedAt=0;const pool=[document.createElement("canvas"),document.createElement("canvas")];
 const stats={paints:0,lastMs:0,reliefMs:0,reliefCached:false};
 const dprOf=DPR;   // same cap as resize() in canvas.js
 function renderCache(slot,z,ox,oy){const d=dprOf(),c=pool[slot],w=Math.max(1,Math.round(W*d)),h=Math.max(1,Math.round(MH()*d));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h}const g=c.getContext("2d");g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
  const t0=performance.now();paint(g,{W,s:mapS(),cy:mapCY(),z,ox,oy,d});stats.paints++;stats.lastMs=Math.round(performance.now()-t0);
  return{c,z,ox,oy}}
 /* draw a cache made for view (z0,ox0,oy0) into the current view MV */
 function blit(cc){const k=MV.z/cc.z,cy=mapCY(),dx=W/2+MV.ox-(W/2+cc.ox)*k,dy=cy+MV.oy-(cy+cc.oy)*k;
  ctx.drawImage(cc.c,dx,dy,W*k,MH()*k)}

 /* ---------- live layer (every frame) ---------- */
 function live(t){const C=pal(),D=deco(),s0=mapS()*MV.z,zz=Math.sqrt(MV.z);
  /* sea glints: tiny sun sparkles that fade in and out */
  ctx.save();ctx.lineCap="round";ctx.lineWidth=1.2;
  for(const[lo,la,len,ph,sp]of D.glints){const a=Math.sin(t/1900*sp+ph);if(a<=.35)continue;const[x,y]=mp(lo,la);if(x<-20||y<-20||x>W+20||y>MH()+20)continue;
   const al=(a-.35)/.65,L=len*zz*.6;ctx.strokeStyle="rgba(255,255,255,"+(al*al*.4)+")";ctx.beginPath();ctx.moveTo(x-L/2,y);ctx.lineTo(x+L/2,y);ctx.moveTo(x-L/4+2,y+3);ctx.lineTo(x+L/4+2,y+3);ctx.stroke()}
  /* Nile shimmer: light dashes drifting downstream (south → north) */
  const P=(lo,la)=>mp(lo,la),dam=NILE.findIndex(q=>q[1]>=23.97);
  ctx.setLineDash([2.5,15]);ctx.lineDashOffset=-(t/55)%17.5;ctx.strokeStyle=rgba(C.waterHi,.6);ctx.lineWidth=Math.max(1,Math.min(2.2,s0*.018));
  ctx.beginPath();spath(ctx,P,NILE.slice(dam));spath(ctx,P,ROSETTA);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
 /* vignette: a full-screen radial gradient is expensive on phones, so paint it once per size/theme and blit it */
 let vig=null,vigKey="";
 function vignette(){const C=pal(),h=MH(),key=W+"|"+h+"|"+C.fog;
  if(key!==vigKey){vigKey=key;const sc=.5;vig=vig||document.createElement("canvas");vig.width=Math.max(1,Math.round(W*sc));vig.height=Math.max(1,Math.round(h*sc));
   const g=vig.getContext("2d"),r1=Math.hypot(W,h)*.62*sc,gr=g.createRadialGradient(W/2*sc,h*.52*sc,Math.max(W,h)*.34*sc,W/2*sc,h*.52*sc,r1);
   gr.addColorStop(0,"rgba("+C.fog+",0)");gr.addColorStop(1,"rgba("+C.fog+",.55)");g.clearRect(0,0,vig.width,vig.height);g.fillStyle=gr;g.fillRect(0,0,vig.width,vig.height)}
  ctx.drawImage(vig,0,0,W,h)}

 return{
  stats,
  invalidate(){envKey=""},
  draw(t){startRelief();const key=[W,MH(),dprOf(),theme,mapS().toFixed(4),mapCY().toFixed(2)].join("|");
   if(key!==envKey){envKey=key;home=view=null}
   if(!home)home=renderCache(0,1,0,0);
   const atHome=MV.z===1&&MV.ox===0&&MV.oy===0;
   if(MV.z!==lastMV.z||MV.ox!==lastMV.ox||MV.oy!==lastMV.oy){lastMV={z:MV.z,ox:MV.ox,oy:MV.oy};movedAt=t}
   let fresh=view&&view.z===MV.z&&view.ox===MV.ox&&view.oy===MV.oy;
   if(!atHome&&!fresh&&t-movedAt>220&&!mptr.size){view=renderCache(1,MV.z,MV.ox,MV.oy);fresh=true}
   /* draw as little as possible: one exact-fit image at rest, both caches only mid-gesture */
   if(atHome)blit(home);else if(fresh)blit(view);else{ctx.fillStyle="rgb("+pal().fog+")";ctx.fillRect(0,0,W,H);blit(home);if(view)blit(view)}
   live(t);vignette()},
  /* Standalone render of the artwork only (no labels/markers/UI), e.g. for a store screenshot or preview.
     Fits the whole country into w×h. Returns a canvas. */
  renderImage(w,h){startRelief(true);const c=document.createElement("canvas");c.width=w;c.height=h;const s=Math.min(w*.9/13.2,h*.9/10.6);
   paint(c.getContext("2d"),{W:w,s,cy:h/2,z:1,ox:(31-30.9)*s,oy:0,d:1});return c}
 }})();
