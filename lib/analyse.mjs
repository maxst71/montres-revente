// Fonctions pures partagées : reconnaître un modèle surveillé dans un titre d'annonce et estimer la marge.
// Utilisées par la veille eBay (lib/veille.mjs) et par l'extension Chrome (copie dans extension/analyse.mjs).

export const EXCLUS_DEFAUT = ["replica", "réplique", "copie", "fake", "pour pièces", "hs", "ne fonctionne pas", "boîte seule", "boite seule", "bracelet seul", "lot de"];

export function normaliser(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function contientMot(titreNorm, mot) {
  const m = normaliser(mot);
  return m && ` ${titreNorm} `.includes(` ${m} `);
}

// Un mot-clé est présent tel quel, ou collé (« AE-1200 » trouve « AE1200WH ») s'il est assez long.
function motPresent(titreNorm, mot) {
  if (contientMot(titreNorm, mot)) return true;
  const colle = normaliser(mot).replace(/ /g, "");
  return colle.length >= 4 && titreNorm.replace(/ /g, "").includes(colle);
}

// Une surveillance correspond si tous ses mots-clés sont dans le titre et aucun mot exclu.
export function correspond(titre, surveillance, exclusGlobaux = EXCLUS_DEFAUT) {
  const t = normaliser(titre);
  const mots = String(surveillance.motsCles || "").split(/\s+/).filter((m) => normaliser(m));
  if (!mots.length || !mots.every((m) => motPresent(t, m))) return false;
  const exclus = [...exclusGlobaux, ...String(surveillance.exclus || "").split(",")];
  return !exclus.some((e) => e.trim() && contientMot(t, e));
}

export function trouverSurveillance(titre, surveillances, exclusGlobaux) {
  return surveillances.find((s) => s.active !== false && correspond(titre, s, exclusGlobaux)) || null;
}

// Marge nette si on revend au prix estimé sur la plateforme de revente choisie.
export function estimerMarge({ prix, port = 0, prixRevente, plateforme = { pct: 0, fixe: 0 }, cotisations = 0, pieces = 0 }) {
  const frais = prixRevente > 0 ? (prixRevente * (plateforme.pct || 0)) / 100 + (plateforme.fixe || 0) : 0;
  const cotis = (prixRevente * cotisations) / 100;
  const marge = prixRevente - prix - port - pieces - frais - cotis;
  return { marge, margePct: prixRevente ? (marge / prixRevente) * 100 : 0, frais, cotis };
}
