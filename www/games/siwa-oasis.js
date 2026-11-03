/* Siwa Oasis – Temple of the Oracle — Sliding picture puzzle */
definePlace({
  id:"siwa",
  // map pin
  lon:25.52, lat:29.2,
  en:"Siwa Oasis – Temple of the Oracle",
  ar:"واحة سيوة – معبد الوحي",
  eraEn:"Saite period · 6th century BC",
  eraAr:"العصر الصاوي · القرن السادس ق.م",
  dEn:"A remote desert oasis home to the Oracle of Amun, which Alexander the Great is said to have visited in 331 BC.",
  dAr:"واحة صحراوية نائية تضم معبد وحي آمون الذي يُروى أن الإسكندر الأكبر زاره عام 331 ق.م.",
  logo:"assets/images/siwa.jpg",
  // challenge meta
  challenge:["Sliding picture puzzle","أحجية الصورة المنزلقة"],
  par:70,                // seconds for full speed bonus at level 1
  starTip:["Solve it in few moves","حلّها بحركات قليلة"],
  levels:(x,k)=>gridTxt([3,3,4,4,5][k]),
  fact:["Alexander the Great is said to have visited the Oracle of Amun at Siwa in 331 BC.","يُروى أن الإسكندر الأكبر زار وحي آمون في سيوة عام 331 ق.م."],
  icon(ctx){ctx.fillRect(-1,-2,2,10);for(let i=0;i<5;i++){const a=-2.6+i*.65;ctx.beginPath();ctx.ellipse(Math.cos(a)*6,-3+Math.sin(a)*4,6,2,a*.5,0,7);ctx.fill()}},
  game:(()=>{let pic,n=3,a=[],moves=0,solved=false,md0=1;
 /* Hints. Pressing Hint plans a solution from the CURRENT board and highlights its next HINT_STEPS tiles,
    one at a time, while the player follows it (any other move cancels the hint).
    Plan = weighted A* search (Manhattan distance, small time budget); fallback = `path`, the positions the
    empty square visited since the solved picture — walking it backwards always solves the puzzle. Shorter one wins. */
 const HINT_STEPS=3;let path=[],plan=null,hintLeft=0,hintsUsed=0,extra=0;
 const NN=()=>n*n,baseLim=()=>Math.round(md0*5+20),lim=()=>baseLim()+extra; // move limit → lose; a hint plan always fits (extra moves)
 const nb=b=>{const r=Math.floor(b/n),c=b%n,o=[];if(r>0)o.push(b-n);if(r<n-1)o.push(b+n);if(c>0)o.push(b-1);if(c<n-1)o.push(b+1);return o};
 const isSolved=()=>a.every((v,i)=>v===i);
 const btn=()=>{const{s,x0,y0}=tileLay(n);return{x:W/2-100,y:y0+s+18,w:200,h:42}};
 const hintTile=()=>hintLeft>0&&plan&&plan.length?plan[0]:-1;
 function search(Wt,budget){const N2=NN(),goal=N2-1,t0=performance.now(),start=Uint8Array.from(a);
  const h=st=>{let v=0;for(let i=0;i<N2;i++){const x=st[i];if(x!==goal)v+=Math.abs((i/n|0)-(x/n|0))+Math.abs(i%n-x%n)}return v};
  const heap=[],up=(f,nd)=>{heap.push([f,nd]);let i=heap.length-1;while(i>0){const q=(i-1)>>1;if(heap[q][0]<=heap[i][0])break;[heap[q],heap[i]]=[heap[i],heap[q]];i=q}},
   down=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m}}return top[1]};
  const key=st=>String.fromCharCode.apply(null,st),best=new Map([[key(start),0]]);up(Wt*h(start),{st:start,b:start.indexOf(goal),g:0,prev:null,mv:-1});
  for(let nodes=0;heap.length&&nodes<200000&&performance.now()-t0<budget;nodes++){const nd=down();
   if(h(nd.st)===0){const out=[];for(let x=nd;x.prev;x=x.prev)out.push(x.mv);return out.reverse()}
   for(const m of nb(nd.b)){if(nd.prev&&m===nd.prev.b)continue;const st=nd.st.slice();st[nd.b]=st[m];st[m]=goal;const k=key(st),g=nd.g+1;if(best.has(k)&&best.get(k)<=g)continue;best.set(k,g);up(g+Wt*h(st),{st,b:m,g,prev:nd,mv:m})}}
  return null}
 /* optimal-ish on 3×3, greedier (faster) on bigger boards; retried even greedier before falling back */
 function makePlan(){const back=path.slice(0,-1).reverse(),w=n===3?1:n===4?2.5:7;let found=search(w,180);if(!found&&n===4)found=search(w*2.5,150);
  return found&&found.length<=back.length?found:back}
 return{help:{en:"Slide the tiles to rebuild the Siwa Oasis picture. Higher levels use smaller pieces. Stuck? Tap Hint to see the next moves",ar:"حرّك القطع لإعادة بناء صورة واحة سيوة. المستويات الأعلى بقطع أصغر. عالق؟ اضغط تلميح لترى الحركات التالية"},
 start(){const lv=Math.min(LV(),4);n=[3,3,4,4,5][lv];pic=pickScene("siwa");a=[...Array(NN()).keys()];moves=0;solved=false;hintLeft=0;hintsUsed=0;plan=null;extra=0;let b=NN()-1,last=-1;path=[b];
  const step=()=>{const c=nb(b).filter(x=>x!==last),m=c[Math.floor(Math.random()*c.length)];[a[b],a[m]]=[a[m],a[b]];last=b;b=m;path.push(m)};
  const steps=Math.round([14,45,60,120,200][lv]*(n>3?1.6:1));for(let k=0;k<steps;k++)step();while(isSolved())step();
  md0=a.reduce((m,v,i)=>v===NN()-1?m:m+Math.abs(Math.floor(i/n)-Math.floor(v/n))+Math.abs(i%n-v%n),0)},
 status(){return L2("Moves ","الحركات ")+moves+"/"+lim()},
 hintTile:()=>hintTile(),   // read-only: index of the tile the current hint points at (-1 = none)
 draw(){sandBg();const{s,x0,y0,t}=tileLay(n),ps=300/n;ctx.fillStyle="#3a2208";ctx.fillRect(x0-6,y0-6,s+12,s+12);
  a.forEach((v,i)=>{if(v===NN()-1&&!solved)return;const x=x0+(i%n)*t,y=y0+Math.floor(i/n)*t;ctx.drawImage(pic,(v%n)*ps,Math.floor(v/n)*ps,ps,ps,x,y,t,t);ctx.strokeStyle="rgba(58,34,8,.85)";ctx.lineWidth=2;ctx.strokeRect(x,y,t,t);
   ctx.font="bold "+Math.max(10,Math.round(t*.2))+"px system-ui";ctx.textAlign="left";ctx.lineWidth=3;ctx.lineJoin="round";ctx.strokeStyle="rgba(0,0,0,.6)";ctx.fillStyle="rgba(255,255,255,.9)";ctx.strokeText(v+1,x+4,y+t*.22);ctx.fillText(v+1,x+4,y+t*.22)});
  /* hint: pulsing gold frame on the tile to slide + arrow towards the empty square */
  const hi=hintTile();if(hintLeft>0&&hi>=0&&!solved){const now=performance.now(),p=.5+.5*Math.sin(now/140),x=x0+(hi%n)*t,y=y0+Math.floor(hi/n)*t,b=a.indexOf(NN()-1),bx=x0+(b%n+.5)*t,by=y0+(Math.floor(b/n)+.5)*t,cx=x+t/2,cy=y+t/2;
   ctx.save();ctx.fillStyle="rgba(255,224,138,"+(.18+.14*p)+")";ctx.fillRect(x,y,t,t);ctx.strokeStyle="#ffe08a";ctx.lineWidth=4+2*p;ctx.strokeRect(x+3,y+3,t-6,t-6);
   const ang=Math.atan2(by-cy,bx-cx),L=t*.42;ctx.translate(cx,cy);ctx.rotate(ang);ctx.fillStyle="#ffe08a";ctx.strokeStyle="#3a2208";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L,0);ctx.lineTo(L-t*.16,-t*.11);ctx.lineTo(L-t*.16,t*.11);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  /* hint button (uses the shared hint stock; when empty it offers a rewarded ad) */
  if(!solved){const bt=btn(),has=inv.hint>0;ctx.fillStyle=has?"#2a3350":"#3a3a44";rr(bt.x,bt.y,bt.w,bt.h,12);ctx.fill();ctx.strokeStyle="#e6b84a";ctx.lineWidth=2;ctx.stroke();
   const gx=bt.x+26,gy=bt.y+bt.h/2-1;ctx.fillStyle="#f3c969";ctx.beginPath();ctx.arc(gx,gy-3,7,Math.PI*.8,Math.PI*2.2);ctx.lineTo(gx+3,gy+6);ctx.lineTo(gx-3,gy+6);ctx.closePath();ctx.fill();ctx.fillRect(gx-3,gy+8,6,2.5);
   ctx.fillStyle="#fff";ctx.font="bold 16px system-ui";ctx.textAlign="center";ctx.fillText(hintLeft>0?L2("Follow the arrow","اتبع السهم"):L2("Hint","تلميح")+" ("+(has?inv.hint:Ads.canReward()?L2("ad","إعلان"):"0")+")",bt.x+bt.w/2+14,bt.y+bt.h/2+6)}},
 tap(px,py){if(solved)return;
  {const bt=btn();if(px>=bt.x&&px<=bt.x+bt.w&&py>=bt.y&&py<=bt.y+bt.h){if(hintLeft>0)return;
   if(inv.hint<1){adForHints();return}if(!plan||!plan.length)plan=makePlan();if(!plan.length)return;extra=Math.max(extra,moves+plan.length+3-baseLim());inv.hint--;hintsUsed++;hintLeft=HINT_STEPS;snd("tap");render();return}}
  const{x0,y0,t}=tileLay(n),c=Math.floor((px-x0)/t),r=Math.floor((py-y0)/t);if(c<0||c>=n||r<0||r>=n)return;const i=r*n+c,b=a.indexOf(NN()-1);
  if(!nb(b).includes(i))return;[a[b],a[i]]=[a[i],a[b]];moves++;snd("tap");
  if(path.length>=2&&path[path.length-2]===i)path.pop();else path.push(i);                 // keep the undo path up to date
  if(hintLeft>0){if(plan&&plan[0]===i){plan.shift();hintLeft--}else{hintLeft=0;plan=null}} // following the hint advances it; any other move cancels it
  if(isSolved()){solved=true;hintLeft=0;const st=moves<=md0*2.5+6?3:moves<=md0*4+12?2:1;winGame(hintsUsed>1?Math.min(st,1):st)  /* >1 hint → at most ★★ (perf 1 + speed ≤3) */}else if(moves>=lim())loseGame(L2("Out of moves!","نفدت الحركات!"))}}})()
});
