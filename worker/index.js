// Serves the game from www/ and sends anyone on an old address to the official one.
const HOME = "egypt-quest.am-solutions.workers.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith(".workers.dev") && url.hostname !== HOME) {
      url.hostname = HOME;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  }
};
