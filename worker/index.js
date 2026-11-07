// Serves the game from www/. Old *.workers.dev addresses (e.g. the personal
// egypt-quest.mohammedtaher-6705.workers.dev) are shut off: they return 404 and
// tell the browser to drop anything it cached, so only the official URL works.
const HOME = "egypt-quest.am-solutions.workers.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith(".workers.dev") && url.hostname !== HOME) {
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
