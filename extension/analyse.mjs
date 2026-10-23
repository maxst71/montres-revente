// Copie de lib/analyse.mjs pour l'extension : garder les deux fichiers identiques.
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

// État de la montre lu sur l'annonce : coefficient appliqué au prix de revente estimé
// (qui correspond à une montre en bon état) et avertissement éventuel.
const ETATS = [
  { mots: ["pour pieces", "hors service", "ne fonctionne pas", "defectueux", "a reparer", "en panne"], libelle: "Pour pièces / à réparer", coef: 0.4, alerte: "Ne fonctionne pas : compte une réparation." },
  { mots: ["neuf avec etiquette", "neuf avec boite", "jamais porte"], libelle: "Neuf (avec étiquette ou boîte)", coef: 1.25 },
  { mots: ["tres bon etat", "comme neuf", "excellent etat", "neuf sans etiquette"], libelle: "Très bon état", coef: 1.1 },
  { mots: ["bon etat", "occasion"], libelle: "Bon état", coef: 1 },
  { mots: ["satisfaisant", "etat correct", "etat moyen", "traces d usure", "rayures"], libelle: "État satisfaisant", coef: 0.85, alerte: "Usure visible : prévois polissage ou pièces." },
  { mots: ["neuf"], libelle: "Neuf", coef: 1.2 },
];

export function evaluerEtat(texteEtat) {
  const t = ` ${normaliser(texteEtat)} `;
  const trouve = ETATS.find((e) => e.mots.some((m) => t.includes(` ${m} `)));
  return trouve ? { libelle: trouve.libelle, coef: trouve.coef, alerte: trouve.alerte || "" } : { libelle: "État non précisé", coef: 1, alerte: "" };
}

// Statistiques des prix demandés pour un même modèle dans les annonces consultées.
export function statsPrix(consultations, modele) {
  const prix = consultations.filter((c) => c.modele && c.modele === modele && c.prix > 0).map((c) => c.prix).sort((a, b) => a - b);
  if (!prix.length) return { n: 0 };
  const milieu = Math.floor(prix.length / 2);
  const mediane = prix.length % 2 ? prix[milieu] : (prix[milieu - 1] + prix[milieu]) / 2;
  return { n: prix.length, mediane, min: prix[0], max: prix[prix.length - 1] };
}
