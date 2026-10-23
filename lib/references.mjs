// Base de connaissance des prix : pour chaque référence, les derniers prix vus sur Vinted, Leboncoin et eBay.
// Format compact (une seule clé de stockage) pour rester rapide même avec des milliers d'annonces.
// Les prix sont ramenés à un « équivalent bon état » (prix ÷ coefficient d'état) pour comparer des annonces
// dans des états différents ; l'extension refait prix × coefficient pour estimer une annonce précise.

import { detecterReference, evaluerEtat, groupeAnnonce } from "./analyse.mjs";

const MAX_PAR_REFERENCE = 40;
const MAX_REFERENCES = 1500;

// Identifiant court et stable d'une annonce, pour ne pas la compter deux fois.
export function idAnnonce(url) {
  const u = String(url || "").split(/[?#]/)[0];
  const motifs = [["v", /vinted\.[a-z.]+\/items\/(\d+)/], ["l", /leboncoin\.fr\/.*?(\d{6,})(?:\.htm)?$/], ["e", /ebay\.[a-z.]+\/itm\/(?:[^/]+\/)?(\d{6,})/]];
  for (const [lettre, motif] of motifs) {
    const m = u.match(motif);
    if (m) return lettre + m[1];
  }
  return u.slice(-60);
}

function quantile(tries, q) {
  const pos = (tries.length - 1) * q;
  const bas = Math.floor(pos);
  return tries[bas] + (tries[Math.ceil(pos)] - tries[bas]) * (pos - bas);
}

// n, prix bas (25 %), médiane, prix haut (75 %), min et max, en équivalent bon état.
export function statsReference(r) {
  const prix = (r?.obs || []).map((o) => o[1]).sort((a, b) => a - b);
  if (!prix.length) return { n: 0 };
  const arrondi = (x) => Math.round(x);
  return {
    n: prix.length,
    min: arrondi(prix[0]),
    bas: arrondi(quantile(prix, 0.25)),
    mediane: arrondi(quantile(prix, 0.5)),
    haut: arrondi(quantile(prix, 0.75)),
    max: arrondi(prix[prix.length - 1]),
  };
}

// Ajoute (ou met à jour) une annonce dans la base. Renvoie son groupe ("" si ce n'est pas une référence reconnue)
// et si l'annonce est nouvelle.
export function ajouterObservation(refs, a, maintenant = new Date().toISOString()) {
  const prix = Number(a.prix) || 0;
  if (!prix || !a.titre) return { groupe: "", nouvelle: false };
  const ref = detecterReference(a.titre);
  const groupe = groupeAnnonce({ modele: a.modele ? String(a.modele).slice(0, 100) : "", marque: ref.marque, cle: ref.cle });
  if (!groupe) return { groupe, nouvelle: false };
  const { coef } = evaluerEtat(a.etat || a.titre);
  // Une montre pour pièces ne dit rien du prix d'une montre qui fonctionne.
  if (coef < 0.5) return { groupe, nouvelle: false };
  const id = idAnnonce(a.url);
  const jour = maintenant.slice(0, 10);
  const r = (refs[groupe] ||= { marque: ref.marque, obs: [] });
  const equivalent = Math.round((prix / coef) * 100) / 100;
  const existante = r.obs.find((o) => o[0] === id);
  let nouvelle = false;
  // [id, prix équivalent bon état, prix affiché, jour, plateforme, premier prix affiché]
  if (existante) {
    existante[1] = equivalent;
    existante[2] = prix;
    existante[3] = jour;
  } else {
    nouvelle = true;
    r.obs.push([id, equivalent, prix, jour, String(a.plateforme || "").slice(0, 10), prix]);
    if (r.obs.length > MAX_PAR_REFERENCE) r.obs.splice(0, r.obs.length - MAX_PAR_REFERENCE);
  }
  r.maj = maintenant;
  return { groupe, nouvelle };
}

// Garde les références mises à jour le plus récemment quand la base devient trop grosse.
export function elaguer(refs) {
  const cles = Object.keys(refs);
  if (cles.length <= MAX_REFERENCES) return refs;
  cles.sort((a, b) => String(refs[b].maj).localeCompare(String(refs[a].maj)));
  for (const c of cles.slice(MAX_REFERENCES)) delete refs[c];
  return refs;
}

// Première utilisation : reprend les annonces déjà enregistrées par l'extension.
export function depuisConsultations(consultations) {
  const refs = {};
  for (const c of [...consultations].reverse()) ajouterObservation(refs, c, c.derniereVue || new Date().toISOString());
  return refs;
}

export function listeReferences(refs) {
  return Object.entries(refs)
    .map(([groupe, r]) => ({ groupe, marque: r.marque, maj: r.maj, ...statsReference(r) }))
    .filter((r) => r.n)
    .sort((a, b) => b.n - a.n || String(b.maj).localeCompare(String(a.maj)));
}
