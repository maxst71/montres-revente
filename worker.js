// Version Cloudflare Workers : sert l'appli (dossier public), l'API /api/*
// et lance la veille eBay toutes les 15 minutes (voir triggers dans wrangler.jsonc).
// Données dans le KV lié sous le nom MONTRES. Secrets : APP_PASSWORD, EBAY_CLIENT_ID,
// EBAY_CLIENT_SECRET, TELEGRAM_TOKEN.
import { handle } from "./lib/api.mjs";
import { lancerVeille, detecterTelegram } from "./lib/veille.mjs";

function kv(env) {
  return {
    get: (cle, options) => env.MONTRES.get(cle, options),
    setJSON: (cle, valeur) => env.MONTRES.put(cle, JSON.stringify(valeur)),
  };
}

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      const store = kv(env);
      return handle(request, store, env.APP_PASSWORD, {
        lancerVeille: () => lancerVeille(env, store),
        detecterTelegram: () => detecterTelegram(env, store),
        etat: () => ({
          disponible: true,
          ebayConfigure: Boolean(env.EBAY_CLIENT_ID && env.EBAY_CLIENT_SECRET),
          telegramConfigure: Boolean(env.TELEGRAM_TOKEN),
        }),
      });
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(_event, env, ctx) {
    if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) return;
    ctx.waitUntil(lancerVeille(env, kv(env)).catch((e) => console.error("Veille eBay :", e.message)));
  },
};
