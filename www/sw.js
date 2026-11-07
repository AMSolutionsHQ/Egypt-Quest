/* Offline support for the web build (not used inside the Android app).
   Same-origin files: served from cache, refreshed in the background.
   Bump CACHE when you deploy so old files are dropped. */
const CACHE="egypt-quest-v5.2.1-fix1";
const SHELL=["./","./index.html","./css/style.css","./manifest.webmanifest",
 ...["cairo-latin-400","cairo-latin-600","cairo-latin-700","cairo-arabic-400","cairo-arabic-600","cairo-arabic-700","el-messiri-latin-700","el-messiri-arabic-700"].map(f=>"./assets/fonts/"+f+"-normal.woff2")];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==location.origin)return; // ads & other origins go straight to the network
 /* Pages, scripts and styles: network first (so a deploy reaches players on the next load), cache when offline.
    Images/fonts: cache first, refreshed in the background. */
 const code=r.mode==="navigate"||/\.(html|js|css|webmanifest)$/.test(u.pathname)||u.pathname.endsWith("/");
 if(code){e.respondWith(caches.open(CACHE).then(c=>fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r,{ignoreSearch:true}))));return}
 e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(r);
  const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
  return hit||net}))});
