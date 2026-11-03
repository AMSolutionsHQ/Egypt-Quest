/* Offline support for the web build (not used inside the Android app).
   Same-origin files: served from cache, refreshed in the background.
   Bump CACHE when you deploy so old files are dropped. */
const CACHE="egypt-quest-v4.4.1";
const SHELL=["./","./index.html","./css/style.css","./manifest.webmanifest"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==location.origin)return; // ads & other origins go straight to the network
 e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(r,{ignoreSearch:u.pathname.endsWith(".html")||u.pathname.endsWith("/")});
  const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
  return hit||net}))});
