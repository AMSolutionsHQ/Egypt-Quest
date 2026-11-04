/* ---------- input ----------
   All coordinates are canvas CSS pixels (cvX/cvY from canvas.js).
   A tap = finger lifted within TAP_SLOP px of where it went down. Measured as the
   distance from the start point (not summed jitter), so a slightly wobbly finger
   still counts as a tap instead of being swallowed as a tiny pan. */
const ptr=new Map();let pinch0=0,moved=0;
const TAP_SLOP=COARSE?14:8;
let gDown=null; // pointer currently held inside a mini-game (for drag games)
cv.addEventListener("pointerdown",e=>{try{cv.setPointerCapture(e.pointerId)}catch(_){}
 const x=cvX(e),y=cvY(e);
 if(mode==="map"){mptr.set(e.pointerId,{x,y,sx:x,sy:y});mmoved=0;mpinch=0;return}
 if(cur.game){if(runWon&&!cur.bonus)return;gDown=e.pointerId;cur.game.tap(x,y);return}
 ptr.set(e.pointerId,{x,y,sx:x,sy:y});moved=0;pinch0=0});
cv.addEventListener("pointermove",e=>{const nx=cvX(e),ny=cvY(e);
 if(mode==="map"){mapMove(e,nx,ny);return}
 if(mode==="world"&&cur.game){if(cur.game.move&&(gDown===e.pointerId||e.buttons))cur.game.move(nx,ny);return}
 if(mode!=="world"||!ptr.has(e.pointerId))return;
 const p=ptr.get(e.pointerId);
 if(ptr.size===1){moved=Math.max(moved,Math.hypot(nx-p.sx,ny-p.sy));
  if(moved>=TAP_SLOP){V.ox+=nx-p.x;V.oy+=ny-p.y;clampV()} // don't nudge the view during a tap
  p.x=nx;p.y=ny}
 else{p.x=nx;p.y=ny;const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);moved=99;if(pinch0)zoomAt((a.x+b.x)/2,(a.y+b.y)/2,d/pinch0);pinch0=d}});
cv.addEventListener("pointerup",e=>{if(gDown===e.pointerId)gDown=null;
 if(mode==="map"){mapUp(e,cvX(e),cvY(e));return}if(mode!=="world")return;
 if(ptr.size===1&&moved<TAP_SLOP&&ptr.has(e.pointerId)){const p=ptr.get(e.pointerId);worldTap(p.sx,p.sy)}
 ptr.delete(e.pointerId);pinch0=0});
cv.addEventListener("pointercancel",e=>{if(gDown===e.pointerId)gDown=null;ptr.delete(e.pointerId);mptr.delete(e.pointerId);pinch0=0;mpinch=0});
cv.addEventListener("contextmenu",e=>e.preventDefault()); // long-press menu on Android Chrome
cv.addEventListener("wheel",e=>{if(mode==="map"){e.preventDefault();mapZoom(cvX(e),cvY(e),e.deltaY<0?1.12:.9);return}if(mode==="world"){e.preventDefault();zoomAt(cvX(e),cvY(e),e.deltaY<0?1.1:.9)}},{passive:false});
