// Version Cloudflare Pages de l'API : mêmes routes que la fonction Netlify,
// stockage dans le KV lié sous le nom MONTRES, mot de passe dans APP_PASSWORD.
import { handle } from "../../lib/api.mjs";

export const onRequest = ({ request, env }) => {
  const store = {
    get: (cle, options) => env.MONTRES.get(cle, options),
    setJSON: (cle, valeur) => env.MONTRES.put(cle, JSON.stringify(valeur)),
  };
  return handle(request, store, env.APP_PASSWORD);
};
