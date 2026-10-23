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

// Groupe d'une annonce consultée : le modèle surveillé reconnu, sinon la marque et la référence détectées
// (une marque seule ne suffit pas à comparer des prix).
export function groupeAnnonce(c) {
  if (c.modele) return c.modele;
  return c.cle && c.cle !== c.marque ? c.cle : "";
}

// Statistiques des prix demandés dans un même groupe d'annonces consultées.
export function statsPrix(consultations, groupe) {
  if (!groupe) return { n: 0 };
  const prix = consultations.filter((c) => c.prix > 0 && groupeAnnonce(c) === groupe).map((c) => c.prix).sort((a, b) => a - b);
  if (!prix.length) return { n: 0 };
  const milieu = Math.floor(prix.length / 2);
  const mediane = prix.length % 2 ? prix[milieu] : (prix[milieu - 1] + prix[milieu]) / 2;
  return { n: prix.length, mediane, min: prix[0], max: prix[prix.length - 1] };
}

// Reconnaissance automatique de la marque et de la référence dans n'importe quel titre,
// pour que chaque annonce consultée enrichisse la base même si le modèle n'est pas surveillé.
const MARQUES = {
  Casio: ["casio", "g shock", "gshock", "baby g", "edifice", "pro trek", "protrek", "oceanus"],
  Seiko: ["seiko", "grand seiko", "presage", "prospex", "credor"],
  Citizen: ["citizen", "promaster"],
  Orient: ["orient", "orient star"],
  Timex: ["timex"], Swatch: ["swatch", "moonswatch"], Tissot: ["tissot"], Hamilton: ["hamilton"],
  Omega: ["omega"], Rolex: ["rolex"], Tudor: ["tudor"], Longines: ["longines"], "TAG Heuer": ["tag heuer", "heuer", "tagheuer"],
  Breitling: ["breitling"], Oris: ["oris"], Certina: ["certina"], Mido: ["mido"], Rado: ["rado"], "Raymond Weil": ["raymond weil"],
  "Frédérique Constant": ["frederique constant"], "Baume & Mercier": ["baume mercier", "baume et mercier"], Zenith: ["zenith"],
  IWC: ["iwc"], "Jaeger-LeCoultre": ["jaeger lecoultre", "jaeger le coultre", "lecoultre"], Cartier: ["cartier"], Panerai: ["panerai"],
  Bulova: ["bulova", "accutron"], Lip: ["lip"], Yema: ["yema"], Herbelin: ["herbelin"], Pequignet: ["pequignet"], Dodane: ["dodane"],
  Beuchat: ["beuchat"], Festina: ["festina"], Lotus: ["lotus"], Fossil: ["fossil"], "Michael Kors": ["michael kors"],
  "Daniel Wellington": ["daniel wellington"], Guess: ["guess"], Diesel: ["diesel"], "Emporio Armani": ["emporio armani", "armani"],
  "Hugo Boss": ["hugo boss", "boss"], Lacoste: ["lacoste"], "Tommy Hilfiger": ["tommy hilfiger"], Nixon: ["nixon"], Invicta: ["invicta"],
  Victorinox: ["victorinox", "swiss army"], Wenger: ["wenger"], Junghans: ["junghans"], Sinn: ["sinn"], Stowa: ["stowa"], Laco: ["laco"],
  Damasko: ["damasko"], Vostok: ["vostok", "komandirskie", "amphibia"], Poljot: ["poljot", "sturmanskie"], Raketa: ["raketa"],
  Slava: ["slava"], Pobeda: ["pobeda"], Zaria: ["zaria"], Luch: ["luch"], Seagull: ["seagull", "sea gull"], Lorus: ["lorus"], Pulsar: ["pulsar"],
  Suunto: ["suunto"], Garmin: ["garmin"], Polar: ["polar"], "Apple Watch": ["apple watch"], Samsung: ["galaxy watch"], Withings: ["withings"],
  Skagen: ["skagen"], Obaku: ["obaku"], Boccia: ["boccia"], Calypso: ["calypso"], Jaguar: ["jaguar"], "Maurice Lacroix": ["maurice lacroix"],
  Ebel: ["ebel"], Eterna: ["eterna"], Edox: ["edox"], Alpina: ["alpina"], Ball: ["ball watch"], Glycine: ["glycine"], Fortis: ["fortis"],
  Doxa: ["doxa"], Squale: ["squale"], Zodiac: ["zodiac"], Enicar: ["enicar"], "Universal Genève": ["universal geneve"], Movado: ["movado"],
  Wittnauer: ["wittnauer"], Waltham: ["waltham"], Elgin: ["elgin"], Gruen: ["gruen"], Benrus: ["benrus"], "Favre-Leuba": ["favre leuba"],
  Mondaine: ["mondaine"], "Swiss Military": ["swiss military"], Luminox: ["luminox"], Traser: ["traser"], Marathon: ["marathon watch"],
  Steinhart: ["steinhart"], Bering: ["bering"], "Ice-Watch": ["ice watch"], Kronaby: ["kronaby"], Timberland: ["timberland"], Police: ["police"],
  Nautica: ["nautica"], Breil: ["breil"], Sector: ["sector"], Viceroy: ["viceroy"], Maserati: ["maserati"], "Pierre Lannier": ["pierre lannier"],
  "Patek Philippe": ["patek philippe", "patek"], "Audemars Piguet": ["audemars piguet"], "Vacheron Constantin": ["vacheron constantin"],
  Blancpain: ["blancpain"], Breguet: ["breguet"], Chopard: ["chopard"], Hublot: ["hublot"], "Bell & Ross": ["bell ross", "bell et ross"],
  Montblanc: ["montblanc", "mont blanc"], "Ulysse Nardin": ["ulysse nardin"], "Girard-Perregaux": ["girard perregaux"], Nomos: ["nomos"],
  "Glashütte Original": ["glashutte original"], "A. Lange & Söhne": ["lange sohne", "lange und sohne"], Bremont: ["bremont"],
  "Christopher Ward": ["christopher ward"], Baltic: ["baltic"], Briston: ["briston"], "March LA.B": ["march lab"], Kelton: ["kelton"],
  Dugena: ["dugena"], Kienzle: ["kienzle"], Ruhla: ["ruhla"], Anker: ["anker"], Certus: ["certus"], Lumberjack: ["lumberjack"],
  "Marc Jacobs": ["marc jacobs"], "Ted Lapidus": ["ted lapidus"], "Louis Pion": ["louis pion"], Tribord: ["tribord"], Kalenji: ["kalenji"],
};
const ALIAS = Object.entries(MARQUES)
  .flatMap(([marque, alias]) => alias.map((a) => [a, marque]))
  .sort((a, b) => b[0].length - a[0].length);
// Codes qui ressemblent à une référence mais n'en sont pas (tailles, matières, étanchéité…).
const FAUX_CODES = /^(MM|CM|K|KT|CT|ATM|BAR|M|L|REF|N|NO|X|V|T|S|XL|XXL|GR|G|W|H|LOT|PACK|SIZE|TAILLE|AN|ANS|ANNEES|ACIER|OR|HOMME|FEMME|SERIE|MODEL|TYPE|CAL|CALIB)$/;
const FAUX_SUFFIXES = /^(MM|CM|M|ATM|BAR|K|KT|CT|ANS?|G|GR)$/;
// Noms de modèles connus, utilisés quand le titre ne contient pas de code de référence.
const FAMILLES = [
  "submariner", "datejust", "daytona", "gmt master", "explorer", "oyster perpetual", "air king", "black bay", "pelagos",
  "seamaster", "speedmaster", "constellation", "de ville", "aqua terra", "conquest", "hydroconquest", "master collection",
  "carrera", "aquaracer", "monaco", "formula 1", "navitimer", "superocean", "chronomat", "aquis", "big crown", "divers sixty five",
  "ds action", "ocean star", "multifort", "commander", "prx", "seastar", "visodate", "le locle", "gentleman", "t touch", "pr 516",
  "khaki", "jazzmaster", "ventura", "lunar pilot", "accutron", "tank", "santos", "pasha", "luminor",
  "bambino", "kamasu", "mako", "ray", "triton", "monster", "turtle", "samurai", "sumo", "alpinist", "cocktail time", "presage",
  "tsuyosa", "fugu", "eco drive", "moonswatch", "sistem51", "irony", "amphibia", "komandirskie", "himalaya", "nautic ski",
  "royale", "duro", "marlin", "weekender", "expedition", "ironman", "data bank", "max bill", "superman", "navygraf",
];

export function detecterReference(titre) {
  const t = ` ${normaliser(titre)} `;
  const alias = ALIAS.find(([a]) => t.includes(` ${a} `));
  const marque = alias ? alias[1] : "";
  const haut = String(titre).toUpperCase();
  let reference = "";
  for (const m of haut.matchAll(/\b([A-Z]{1,5})[- ]?(\d{2,5})([A-Z0-9]*)\b/g)) {
    if (FAUX_CODES.test(m[1]) || FAUX_SUFFIXES.test(m[3]) || ALIAS.some(([a]) => a === m[1].toLowerCase())) continue;
    reference = `${m[1]}${m[2]}`;
    break;
  }
  // Références uniquement en chiffres (Rolex 16610, Seiko 6139…), en évitant les années et les tailles.
  if (!reference) {
    const chiffres = [...haut.matchAll(/\b(\d{4,6})(?![\d.,]|\s?(MM|CM|M\b|ATM|BAR|€|EUR))/g)].map((m) => m[1]).find((n) => !/^(19|20)\d{2}$/.test(n));
    if (chiffres) reference = chiffres;
  }
  const famille = FAMILLES.find((f) => t.includes(` ${f} `)) || "";
  const nomFamille = famille.length <= 3 ? famille.toUpperCase() : famille.replace(/\b\w/g, (c) => c.toUpperCase());
  const detail = reference || nomFamille;
  return { marque, reference, famille: nomFamille, cle: marque ? `${marque}${detail ? " " + detail : ""}` : "" };
}
