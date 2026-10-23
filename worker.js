// Version Cloudflare Workers : sert l'appli (dossier public) et l'API /api/*.
// Données dans le KV lié sous le nom MONTRES, mot de passe dans le secret APP_PASSWORD.
import { handle } from "./lib/api.mjs";

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      const store = {
        get: (cle, options) => env.MONTRES.get(cle, options),
        setJSON: (cle, valeur) => env.MONTRES.put(cle, JSON.stringify(valeur)),
      };
      return handle(request, store, env.APP_PASSWORD);
    }
    return env.ASSETS.fetch(request);
  },
};
