/* ---------- WORLD BUILDING BLOCKS ---------- */
const Blk=(x,y,w,h,c="#cfa86a",s=true)=>({t:"blk",x,y,w,h,c,s});
const Col=(x,y,r,c="#d8bd86")=>({t:"col",x,y,r,c,s:true});
const WA=(x,y,w,h)=>({t:"water",x,y,w,h,s:true});
const PA=(x,y)=>({t:"palm",x,y,s:false});
const PY=(x,y,sz)=>({t:"pyr",x,y,sz,s:true});
const OB=(x,y)=>({t:"obe",x,y,s:true});
const LD=(x,y,w,h,c)=>({t:"land",x,y,w,h,c,s:false});
const EL=(x,y,rx,ry,c)=>({t:"ell",x,y,rx,ry,c,s:false});
const LB=(x,y,en,ar)=>({t:"lbl",x,y,en,ar,s:false});
function sandDeco(seed,w,h){let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647,a=[];
 for(let i=0;i<14;i++)a.push({t:"dune",x:r()*w,y:r()*h,w:120+r()*180,h:14+r()*16,s:false});
 for(let i=0;i<60;i++)a.push({t:"rock",x:r()*w,y:r()*h,r:3+r()*7,s:false});return a}
function mk(o){o.sol=o.items.filter(i=>i.s).map(i=>i.t==="col"?{x:i.x-i.r,y:i.y-i.r,w:2*i.r,h:2*i.r}:i.t==="pyr"?{x:i.x-i.sz/2,y:i.y-i.sz/2,w:i.sz,h:i.sz}:i.t==="obe"?{x:i.x-11,y:i.y-11,w:22,h:22}:{x:i.x,y:i.y,w:i.w,h:i.h});return o}
/* ---------- WORLD DRAW ---------- */
const sh=(x,y,w,h)=>{ctx.fillStyle="rgba(60,35,10,.22)";ctx.fillRect(x+6,y+6,w,h)};
function item(it){switch(it.t){
 case"land":ctx.fillStyle=it.c;ctx.fillRect(it.x,it.y,it.w,it.h);break;
 case"ell":ctx.beginPath();ctx.ellipse(it.x,it.y,it.rx,it.ry,0,0,7);ctx.fillStyle=it.c;ctx.fill();ctx.lineWidth=6;ctx.strokeStyle="#e8dcb0";ctx.stroke();break;
 case"dune":ctx.fillStyle="rgba(255,235,180,.35)";ctx.beginPath();ctx.ellipse(it.x,it.y,it.w,it.h,0,0,7);ctx.fill();break;
 case"rock":ctx.fillStyle="#a88a58";ctx.beginPath();ctx.arc(it.x,it.y,it.r,0,7);ctx.fill();break;
 case"water":ctx.fillStyle="#2f86b5";ctx.fillRect(it.x,it.y,it.w,it.h);ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=2;
  for(let y=it.y+20;y<it.y+it.h;y+=38){ctx.beginPath();ctx.moveTo(it.x+10,y);ctx.lineTo(it.x+it.w-10,y);ctx.setLineDash([30,24]);ctx.stroke();ctx.setLineDash([])}break;
 case"palm":ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.arc(it.x+5,it.y+6,20,0,7);ctx.fill();ctx.fillStyle="#3f8f4a";
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.beginPath();ctx.ellipse(it.x+Math.cos(a)*14,it.y+Math.sin(a)*14,15,5,a,0,7);ctx.fill()}
  ctx.fillStyle="#6a4a1a";ctx.beginPath();ctx.arc(it.x,it.y,5,0,7);ctx.fill();break;
 case"blk":if(it.s)sh(it.x,it.y,it.w,it.h);ctx.fillStyle=it.c;ctx.fillRect(it.x,it.y,it.w,it.h);
  ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(it.x,it.y,it.w,Math.min(it.h*.3,14));
  ctx.strokeStyle="rgba(80,50,15,.55)";ctx.lineWidth=1.5;ctx.strokeRect(it.x,it.y,it.w,it.h);break;
 case"col":ctx.fillStyle="rgba(60,35,10,.25)";ctx.beginPath();ctx.arc(it.x+4,it.y+5,it.r,0,7);ctx.fill();
  ctx.fillStyle=it.c;ctx.beginPath();ctx.arc(it.x,it.y,it.r,0,7);ctx.fill();ctx.strokeStyle="rgba(80,50,15,.6)";ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(it.x,it.y,it.r*.55,0,7);ctx.stroke();break;
 case"obe":sh(it.x-11,it.y-11,22,22);ctx.fillStyle="#b9855a";ctx.fillRect(it.x-11,it.y-11,22,22);
  ctx.fillStyle="#e6b84a";ctx.beginPath();ctx.moveTo(it.x,it.y-8);ctx.lineTo(it.x+8,it.y+8);ctx.lineTo(it.x-8,it.y+8);ctx.closePath();ctx.fill();break;
 case"pyr":{const h=it.sz/2,x0=it.x-h,y0=it.y-h,x1=it.x+h,y1=it.y+h,c=[it.x,it.y];
  ctx.fillStyle="rgba(60,35,10,.22)";ctx.fillRect(x0+it.sz*.12,y0+it.sz*.12,it.sz,it.sz);
  const f=(col,a,b)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.fillStyle=col;ctx.fill()};
  f("#ecca8c",[x0,y0],[x1,y0]);f("#dcb672",[x0,y0],[x0,y1]);f("#bb904f",[x1,y0],[x1,y1]);f("#a67c42",[x0,y1],[x1,y1]);
  ctx.strokeStyle="rgba(80,50,15,.5)";ctx.lineWidth=1.5;ctx.strokeRect(x0,y0,it.sz,it.sz);
  ctx.beginPath();[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].forEach(q=>{ctx.moveTo(q[0],q[1]);ctx.lineTo(c[0],c[1])});ctx.stroke();break}
 case"lbl":ctx.font="bold 15px system-ui";ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="rgba(20,12,0,.7)";
  const tx=lang==="ar"?it.ar:it.en;ctx.strokeText(tx,it.x,it.y);ctx.fillStyle="#fff4d0";ctx.fillText(tx,it.x,it.y);break}}
const GRD={land:1,ell:1,dune:1,rock:1,water:1};
const V={z:1,ox:0,oy:0};let fx=[],hintUntil=0,hintIdx=-1,hintsLeft=3,found=new Set();const prog={};
const minZ=()=>Math.max(.2,Math.min(W/cur.w,H/cur.h));
function clampV(){V.z=Math.max(minZ(),Math.min(2.2,V.z));const sw=cur.w*V.z,sh=cur.h*V.z;
 V.ox=sw<=W?(W-sw)/2:Math.max(W-sw,Math.min(0,V.ox));V.oy=sh<=H?(H-sh)/2:Math.max(H-sh,Math.min(0,V.oy))}
function initView(){V.z=Math.max(minZ(),Math.min(1,W/800));V.ox=W/2-cur.w/2*V.z;V.oy=H/2-cur.h/2.2*V.z;clampV()}
function zoomAt(sx,sy,f){const nz=Math.max(minZ(),Math.min(2.2,V.z*f)),r=nz/V.z;V.ox=sx-(sx-V.ox)*r;V.oy=sy-(sy-V.oy)*r;V.z=nz;clampV()}
function art(a,t,i){if(found.has(i))return;ctx.save();ctx.translate(a[0],a[1]);const sc=i<0?1:Math.max(.6,1-LV()*.08);ctx.scale(sc,sc);if(i>=0){ctx.drawImage(halo(),-26,-26,52,52);ctx.globalAlpha=.8+.2*Math.sin(t/260+i)}
 if(hintIdx===i&&t<hintUntil){ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,26+6*Math.sin(t/120),0,7);ctx.stroke()}
 switch(a[2]){
 case"ankh":for(const[c,w]of[["#4a2f0a",8],["#e6b84a",4]]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(0,-7,6,8,0,0,7);ctx.moveTo(0,1);ctx.lineTo(0,14);ctx.moveTo(-8,5);ctx.lineTo(8,5);ctx.stroke()}break;
 case"scarab":ctx.fillStyle="#2f9e9e";ctx.beginPath();ctx.ellipse(0,0,8,11,0,0,7);ctx.fill();ctx.strokeStyle="#e6b84a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.moveTo(-8,-2);ctx.lineTo(8,-2);ctx.stroke();break;
 case"eye":ctx.fillStyle="#f3ead2";ctx.beginPath();ctx.ellipse(0,0,13,7,0,0,7);ctx.fill();ctx.strokeStyle="#1d4f8a";ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle="#1d4f8a";ctx.beginPath();ctx.arc(0,0,3.5,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(-3,15);ctx.stroke();break;
 case"pyramid":ctx.fillStyle="#c9a366";ctx.beginPath();ctx.moveTo(-12,9);ctx.lineTo(0,-11);ctx.lineTo(12,9);ctx.closePath();ctx.fill();ctx.strokeStyle="#6a4a1a";ctx.lineWidth=2;ctx.stroke();break;
 case"sun":ctx.fillStyle="#ffcf4a";ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill();ctx.strokeStyle="#ffcf4a";ctx.lineWidth=2.5;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10);ctx.lineTo(Math.cos(a)*14,Math.sin(a)*14);ctx.stroke()}break;
 case"feather":ctx.fillStyle="#3a7bd5";ctx.beginPath();ctx.ellipse(0,-2,5,13,.25,0,7);ctx.fill();ctx.strokeStyle="#f3ead2";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,14);ctx.lineTo(3,-12);ctx.stroke();break;
 case"lotus":ctx.fillStyle="#e87aa8";for(const a of[-.7,0,.7]){ctx.save();ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,-7,4.5,10,0,0,7);ctx.fill();ctx.restore()}ctx.fillStyle="#3f8f4a";ctx.beginPath();ctx.ellipse(0,6,10,3.5,0,0,7);ctx.fill();break;
 case"coin":ctx.fillStyle="#e6b84a";ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();ctx.strokeStyle="#8a6a10";ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.stroke();break}
 ctx.restore()}
/* The ground, buildings, palms and labels never change during a run, so they are painted once into an
   offscreen canvas (per place + language) and blitted each frame instead of re-drawing ~80 shapes. */
function worldBase(){const key=lang+"|"+DPR();if(cur._wc&&cur._wk===key)return;
 const cs=Math.min(2,DPR()*1.5,Math.sqrt(4.5e6/(cur.w*cur.h))),c=cur._wc||document.createElement("canvas");
 c.width=Math.ceil(cur.w*cs);c.height=Math.ceil(cur.h*cs);const g=c.getContext("2d"),o=ctx;
 ctx=g;try{g.setTransform(cs,0,0,cs,0,0);
  ctx.fillStyle=cur.sea||cur.ground;ctx.fillRect(0,0,cur.w,cur.h);
  if(cur.sea){ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=2;ctx.setLineDash([36,30]);for(let y=30;y<cur.h;y+=46){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cur.w,y);ctx.stroke()}ctx.setLineDash([])}
  cur.items.forEach(i=>GRD[i.t]&&item(i));
  cur.items.forEach(i=>!GRD[i.t]&&item(i));
 }finally{ctx=o}cur._wc=c;cur._wk=key}
/* soft white halo behind each artifact: one pre-rendered sprite instead of a new radial gradient per artifact per frame */
let HALO=null;function halo(){if(HALO)return HALO;const c=document.createElement("canvas");c.width=c.height=104;const g=c.getContext("2d"),gr=g.createRadialGradient(52,52,8,52,52,104/2);
 gr.addColorStop(0,"rgba(255,255,255,.75)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.beginPath();g.arc(52,52,52,0,7);g.fill();return HALO=c}
function drawWorld(t){
 ctx.fillStyle=cur.bg||"#0e1420";ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(V.ox,V.oy);ctx.scale(V.z,V.z);
 worldBase();ctx.drawImage(cur._wc,0,0,cur.w,cur.h);
 cur.arts.forEach((a,i)=>art(a,t,i));
 {const rem=cur.arts.map((a,i)=>i).filter(i=>!found.has(i));if(rem.length===1&&t-lastFindT>15000){const a=cur.arts[rem[0]];ctx.strokeStyle="rgba(255,255,255,.85)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(a[0],a[1],30+5*Math.sin(t/200),0,7);ctx.stroke()}}
 ctx.strokeStyle="#8a6a35";ctx.lineWidth=4;ctx.strokeRect(0,0,cur.w,cur.h);
 fx=fx.filter(f=>t-f.t0<900);
 fx.forEach(f=>{const k=Math.max(0,(t-f.t0)/900);ctx.globalAlpha=1-k;
  if(f.k==="pop"){ctx.strokeStyle="#ffe08a";ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y,12+k*50,0,7);ctx.stroke()}
  else if(f.k==="txt"){ctx.font="bold 22px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff4d0";ctx.strokeStyle="#5a3a10";ctx.lineWidth=4;ctx.strokeText(f.s,f.x,f.y-k*40);ctx.fillText(f.s,f.x,f.y-k*40)}
  else{ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,6+k*22,0,7);ctx.stroke()}});
 ctx.globalAlpha=1;ctx.restore();
 {const rem=cur.arts.map((a,i)=>i).filter(i=>!found.has(i));if(rem.length===1&&!runWon){const a=cur.arts[rem[0]],sx=V.ox+a[0]*V.z,sy=V.oy+a[1]*V.z;if(sx<10||sx>W-10||sy<70||sy>H-90){const cx=W/2,cy=H/2,ang=Math.atan2(sy-cy,sx-cx),px=Math.max(24,Math.min(W-24,cx+Math.cos(ang)*1000)),py=Math.max(84,Math.min(H-100,cy+Math.sin(ang)*1000));ctx.save();ctx.translate(px,py);ctx.rotate(ang);ctx.fillStyle="#fff";ctx.strokeStyle="#3a2208";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}}}}
function worldTap(sx,sy){if(runWon)return;const wx=(sx-V.ox)/V.z,wy=(sy-V.oy)/V.z,R=Math.max(34,(COARSE?40:28)/V.z);let bi=-1,bd=R;
 cur.arts.forEach((a,i)=>{if(found.has(i))return;const d=Math.hypot(a[0]-wx,a[1]-wy);if(d<bd){bd=d;bi=i}});
 const now=performance.now();
 if(bi<0){fx.push({k:"miss",x:wx,y:wy,t0:now});snd("miss");huntMiss++;return}
 found.add(bi);lastFindT=performance.now();score+=Math.round(20*RATE);snd("ok");const a=cur.arts[bi];fx.push({k:"pop",x:a[0],y:a[1],t0:now},{k:"txt",s:"+"+Math.round(20*RATE),x:a[0],y:a[1]-10,t0:now});
 if(found.size===cur.arts.length)winGame(huntMiss<=4&&huntHints===0?3:huntMiss<=10&&huntHints<=1?2:1);
 render()}
