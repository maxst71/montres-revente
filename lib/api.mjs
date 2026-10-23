// Cœur de l'API, partagé par Netlify et Cloudflare : lit et enregistre toutes les données de l'outil.
// Protégé par le mot de passe APP_PASSWORD. `store` fournit get(cle, { type: "json" }) et setJSON(cle, valeur).
// `actions` (facultatif) branche la veille eBay et Telegram, quand l'hébergeur les gère.

import { detecterReference, groupeAnnonce } from "./analyse.mjs";
import { ajouterObservation, depuisConsultations, elaguer, listeReferences, statsReference } from "./references.mjs";

const DATA_KEY = "donnees";
const MAX_CONSULTATIONS = 2000;

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

const MAX_ANNONCES_PAR_LOT = 100;

async function chargerReferences(store) {
  const refs = await store.get("references", { type: "json" });
  if (refs) return refs;
  return depuisConsultations((await store.get("consultations", { type: "json" })) || []);
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

  // Base de connaissance : annonces consultées avec l'extension Chrome.
  if (path === "consultations" && req.method === "GET") {
    return json({ consultations: (await store.get("consultations", { type: "json" })) || [] });
  }

  if (path === "consultations" && req.method === "POST") {
    let c;
    try {
      c = await req.json();
    } catch {
      return json({ erreur: "JSON invalide." }, 400);
    }
    if (!c?.url || !c.titre) return json({ erreur: "Annonce incomplète." }, 400);
    const liste = (await store.get("consultations", { type: "json" })) || [];
    const ancienne = liste.find((x) => x.url === c.url);
    const ref = detecterReference(c.titre);
    const fiche = {
      marque: ref.marque,
      reference: ref.reference || ref.famille,
      cle: ref.cle,
      url: String(c.url).slice(0, 500),
      plateforme: String(c.plateforme || "").slice(0, 30),
      titre: String(c.titre).slice(0, 200),
      etat: String(c.etat || "").slice(0, 60),
      prix: Number(c.prix) || 0,
      modele: c.modele ? String(c.modele).slice(0, 100) : "",
      prixRevente: Number(c.prixRevente) || 0,
      marge: Number(c.marge) || 0,
      image: String(c.image || "").slice(0, 500),
      premiereVue: ancienne?.premiereVue || new Date().toISOString(),
      derniereVue: new Date().toISOString(),
      vues: (ancienne?.vues || 0) + 1,
      prixInitial: ancienne?.prixInitial ?? (Number(c.prix) || 0),
    };
    const nouvelle = [fiche, ...liste.filter((x) => x.url !== c.url)].slice(0, MAX_CONSULTATIONS);
    await store.setJSON("consultations", nouvelle);
    const refs = await chargerReferences(store);
    const groupe = ajouterObservation(refs, fiche).groupe || groupeAnnonce(fiche);
    await store.setJSON("references", elaguer(refs));
    return json({ ok: true, total: nouvelle.length, groupe, stats: statsReference(refs[groupe]), dejaVue: Boolean(ancienne) });
  }

  // Annonces lues en passant sur les pages de résultats : elles nourrissent la base de prix, sans être listées une par une.
  if (path === "observations" && req.method === "POST") {
    let corps;
    try {
      corps = await req.json();
    } catch {
      return json({ erreur: "JSON invalide." }, 400);
    }
    const annonces = Array.isArray(corps?.annonces) ? corps.annonces.slice(0, MAX_ANNONCES_PAR_LOT) : [];
    const refs = await chargerReferences(store);
    const maintenant = new Date().toISOString();
    let nouvelles = 0;
    const resultats = annonces.map((a) => {
      const { groupe, nouvelle } = ajouterObservation(refs, a, maintenant);
      if (nouvelle) nouvelles++;
      return { url: a.url, groupe };
    });
    await store.setJSON("references", elaguer(refs));
    const stats = {};
    for (const { groupe } of resultats) if (groupe && !stats[groupe]) stats[groupe] = statsReference(refs[groupe]);
    const total = Object.values(refs).reduce((n, r) => n + r.obs.length, 0);
    return json({ ok: true, nouvelles, total, resultats, stats });
  }

  if (path === "references" && req.method === "GET") {
    return json({ references: listeReferences(await chargerReferences(store)) });
  }

  // Ajoute un modèle à surveiller depuis l'extension, sans toucher au reste des données.
  if (path === "surveillances" && req.method === "POST") {
    let s;
    try {
      s = await req.json();
    } catch {
      return json({ erreur: "JSON invalide." }, 400);
    }
    if (!s?.motsCles) return json({ erreur: "Mots-clés manquants." }, 400);
    const data = (await store.get(DATA_KEY, { type: "json" })) || { montres: [], reglages: {} };
    data.reglages.surveillances ||= [];
    const motsCles = String(s.motsCles).slice(0, 100);
    if (!data.reglages.surveillances.some((x) => x.motsCles.toLowerCase() === motsCles.toLowerCase())) {
      data.reglages.surveillances.push({
        id: crypto.randomUUID(),
        nom: String(s.nom || motsCles).slice(0, 100),
        motsCles,
        exclus: "",
        prixRevente: Number(s.prixRevente) || 0,
        prixMax: 0,
        active: true,
      });
      data.majLe = new Date().toISOString();
      await store.setJSON(DATA_KEY, data);
    }
    return json({ ok: true, total: data.reglages.surveillances.length });
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
