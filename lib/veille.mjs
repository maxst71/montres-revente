// Veille automatique eBay : cherche les nouvelles annonces des modèles surveillés,
// estime la marge et prévient sur Telegram quand c'est une bonne affaire.
import { EXCLUS_DEFAUT, correspond, estimerMarge } from "./analyse.mjs";

const EBAY = "https://api.ebay.com";
const MAX_VUS = 3000;
const MAX_ALERTES = 200;
const MAX_NOTIFS_PAR_PASSAGE = 10;

async function jetonEbay(env, fetchFn) {
  const r = await fetchFn(`${EBAY}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: "Basic " + btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`),
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!r.ok) throw new Error(`eBay refuse la connexion (${r.status}) : vérifie EBAY_CLIENT_ID et EBAY_CLIENT_SECRET.`);
  return (await r.json()).access_token;
}

async function chercherEbay(surveillance, jeton, fetchFn) {
  const filtres = ["buyingOptions:{FIXED_PRICE|BEST_OFFER|AUCTION}", "itemLocationCountry:FR"];
  if (surveillance.prixMax > 0) filtres.push(`price:[..${surveillance.prixMax}]`, "priceCurrency:EUR");
  const params = new URLSearchParams({ q: surveillance.motsCles, sort: "newlyListed", limit: "50", filter: filtres.join(",") });
  const r = await fetchFn(`${EBAY}/buy/browse/v1/item_summary/search?${params}`, {
    headers: { authorization: `Bearer ${jeton}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR", "accept-language": "fr-FR" },
  });
  if (!r.ok) throw new Error(`Recherche eBay « ${surveillance.motsCles} » refusée (${r.status}).`);
  return (await r.json()).itemSummaries || [];
}

export async function envoyerTelegram(env, chatId, texte, fetchFn = fetch) {
  if (!env.TELEGRAM_TOKEN || !chatId) return false;
  const r = await fetchFn(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texte, parse_mode: "HTML", disable_web_page_preview: false }),
  });
  return r.ok;
}

// Récupère l'identifiant de conversation : il faut avoir envoyé un message au bot juste avant.
export async function detecterTelegram(env, store, fetchFn = fetch) {
  if (!env.TELEGRAM_TOKEN) throw new Error("Le secret TELEGRAM_TOKEN n'est pas configuré sur Cloudflare.");
  const r = await fetchFn(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/getUpdates`);
  if (!r.ok) throw new Error("Telegram refuse le jeton : vérifie TELEGRAM_TOKEN.");
  const maj = (await r.json()).result || [];
  const dernier = [...maj].reverse().find((u) => u.message?.chat?.id);
  if (!dernier) throw new Error("Aucun message reçu : envoie « bonjour » à ton bot sur Telegram, puis réessaie.");
  const chatId = dernier.message.chat.id;
  await store.setJSON("telegram", { chatId });
  await envoyerTelegram(env, chatId, "✅ iTech Montres est relié à ce Telegram. Tu recevras ici les bonnes affaires.", fetchFn);
  return { chatId };
}

const euros = (n) => `${Math.round(n)} €`;
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

export async function lancerVeille(env, store, fetchFn = fetch) {
  if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) {
    throw new Error("Les secrets EBAY_CLIENT_ID et EBAY_CLIENT_SECRET ne sont pas configurés sur Cloudflare.");
  }
  const donnees = (await store.get("donnees", { type: "json" })) || { reglages: {} };
  const reglages = donnees.reglages || {};
  const surveillances = (reglages.surveillances || []).filter((s) => s.active !== false && s.motsCles && s.prixRevente > 0);
  const params = { margeMin: 20, plateformeRevente: "Vinted", ...(reglages.veille || {}) };
  const plateforme = (reglages.plateformes || []).find((p) => p.nom === params.plateformeRevente) || { pct: 0, fixe: 0 };
  const exclusGlobaux = params.exclus ? params.exclus.split(",") : EXCLUS_DEFAUT;
  const veille = (await store.get("veille", { type: "json" })) || { vus: [], alertes: [] };
  const premierPassage = veille.vus.length === 0;
  const vus = new Set(veille.vus);
  const telegram = (await store.get("telegram", { type: "json" })) || {};
  const erreurs = [];
  const nouvelles = [];

  if (surveillances.length) {
    const jeton = await jetonEbay(env, fetchFn);
    for (const s of surveillances) {
      let annonces = [];
      try {
        annonces = await chercherEbay(s, jeton, fetchFn);
      } catch (e) {
        erreurs.push(e.message);
        continue;
      }
      for (const a of annonces) {
        if (vus.has(a.itemId)) continue;
        vus.add(a.itemId);
        if (!correspond(a.title, s, exclusGlobaux)) continue;
        const prix = parseFloat(a.price?.value) || 0;
        const port = parseFloat(a.shippingOptions?.[0]?.shippingCost?.value) || 0;
        if (!prix) continue;
        const enchere = (a.buyingOptions || []).includes("AUCTION") && !(a.buyingOptions || []).includes("FIXED_PRICE");
        const { marge, margePct } = estimerMarge({ prix, port, prixRevente: s.prixRevente, plateforme, cotisations: reglages.cotisations || 0, pieces: s.pieces || 0 });
        if (marge < params.margeMin) continue;
        nouvelles.push({
          id: a.itemId,
          titre: a.title,
          prix,
          port,
          enchere,
          marge: Math.round(marge),
          margePct: Math.round(margePct),
          prixRevente: s.prixRevente,
          modele: s.nom || s.motsCles,
          image: a.image?.imageUrl || a.thumbnailImages?.[0]?.imageUrl || "",
          url: a.itemWebUrl,
          trouveeLe: new Date().toISOString(),
        });
      }
    }
  }

  nouvelles.sort((a, b) => b.marge - a.marge);
  let notifiees = 0;
  // Au tout premier passage, on n'envoie que les meilleures pour ne pas inonder le téléphone.
  for (const a of nouvelles.slice(0, premierPassage ? 3 : MAX_NOTIFS_PAR_PASSAGE)) {
    const texte =
      `⌚ <b>${esc(a.modele)}</b>${a.enchere ? " (enchère)" : ""}\n${esc(a.titre)}\n\n` +
      `Prix : <b>${euros(a.prix)}</b>${a.port ? ` + ${euros(a.port)} de port` : ""}\n` +
      `Revente estimée : ${euros(a.prixRevente)}\nMarge nette : <b>${euros(a.marge)}</b> (${a.margePct} %)\n\n${a.url}`;
    if (await envoyerTelegram(env, telegram.chatId, texte, fetchFn)) notifiees++;
  }

  const etat = {
    vus: [...vus].slice(-MAX_VUS),
    alertes: [...nouvelles, ...veille.alertes].slice(0, MAX_ALERTES),
    dernierPassage: new Date().toISOString(),
    dernierResultat: { surveillances: surveillances.length, nouvelles: nouvelles.length, notifiees, erreurs },
  };
  await store.setJSON("veille", etat);
  return etat.dernierResultat;
}
