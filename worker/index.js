// Serves the game from www/. Old *.workers.dev addresses (e.g. the personal
// egypt-quest.mohammedtaher-6705.workers.dev) are shut off so only the official URL works.
//
// Why sw.js gets special treatment on the old address: browsers that played there still
// run the OLD service worker, which answers from its offline cache without asking the
// server — so a plain 404 never reaches them. Browsers re-download /sw.js on every visit;
// we hand them this "kill switch" worker, which deletes the cached game, unregisters itself
// and reloads the page, which then shows the 404 below.
const HOME = "egypt-quest.am-solutions.workers.dev";

const KILL_SW = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith(".workers.dev") && url.hostname !== HOME) {
      if (url.pathname === "/sw.js") {
        return new Response(KILL_SW, {
          headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" }
        });
      }
      return new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "clear-site-data": "\"cache\", \"storage\""
        }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
