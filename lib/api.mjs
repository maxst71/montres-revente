// Cœur de l'API, partagé par Netlify et Cloudflare : lit et enregistre toutes les données de l'outil.
// Protégé par le mot de passe APP_PASSWORD. `store` fournit get(cle, { type: "json" }) et setJSON(cle, valeur).
// `actions` (facultatif) branche la veille eBay et Telegram, quand l'hébergeur les gère.

const DATA_KEY = "donnees";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// Comparaison en temps constant, sans dépendre de Node (fonctionne aussi sur Cloudflare).
function passwordOk(given, expected) {
  if (!expected || !given) return false;
  const a = String(given);
  let diff = a.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (a.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function executer(action) {
  try {
    return json({ ok: true, resultat: await action() });
  } catch (e) {
    return json({ erreur: e.message }, 400);
  }
}

export async function handle(req, store, password, actions = {}) {
  if (!password) {
    return json({ erreur: "APP_PASSWORD n'est pas configuré chez l'hébergeur." }, 500);
  }
  if (!passwordOk(req.headers.get("x-password"), password)) {
    return json({ erreur: "Mot de passe incorrect." }, 401);
  }

  const path = new URL(req.url).pathname.replace(/^\/api\/?/, "");

  if (path === "donnees" && req.method === "GET") {
    const data = (await store.get(DATA_KEY, { type: "json" })) || null;
    return json({ data });
  }

  if (path === "donnees" && req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ erreur: "JSON invalide." }, 400);
    }
    if (!body || !Array.isArray(body.montres) || typeof body.reglages !== "object") {
      return json({ erreur: "Format de données invalide." }, 400);
    }
    body.majLe = new Date().toISOString();
    await store.setJSON(DATA_KEY, body);
    // Une sauvegarde par jour, pour pouvoir revenir en arrière en cas d'erreur.
    await store.setJSON(`sauvegarde-${body.majLe.slice(0, 10)}`, body);
    return json({ ok: true, majLe: body.majLe });
  }

  if (path === "login" && req.method === "POST") {
    return json({ ok: true });
  }

  if (path === "veille" && req.method === "GET") {
    const veille = (await store.get("veille", { type: "json" })) || {};
    const telegram = (await store.get("telegram", { type: "json" })) || {};
    return json({
      alertes: veille.alertes || [],
      dernierPassage: veille.dernierPassage || null,
      dernierResultat: veille.dernierResultat || null,
      telegramRelie: Boolean(telegram.chatId),
      ...(actions.etat ? actions.etat() : { disponible: false }),
    });
  }

  if (path === "veille/lancer" && req.method === "POST" && actions.lancerVeille) {
    return executer(() => actions.lancerVeille());
  }

  if (path === "telegram/detecter" && req.method === "POST" && actions.detecterTelegram) {
    return executer(() => actions.detecterTelegram());
  }

  return json({ erreur: "Route inconnue." }, 404);
}
