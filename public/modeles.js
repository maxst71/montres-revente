// Modèles recherchés à petit budget. Fourchettes indicatives en euros (occasion, bon état),
// à confirmer avec les ventes terminées eBay avant chaque achat.
export const MODELES = [
  { marque: "Casio", modele: "Royale AE-1200WH", ref: "AE-1200", achat: [15, 25], revente: [30, 45], conseil: "Vérifier l'éclairage et l'état du verre. Bracelet souvent à changer." },
  { marque: "Casio", modele: "MDV-106 « Duro »", ref: "MDV-106", achat: [40, 55], revente: [65, 90], conseil: "Lunette et bracelet abîmés fréquents : pièces faciles à trouver." },
  { marque: "Casio", modele: "G-Shock DW-5600", ref: "DW-5600", achat: [30, 50], revente: [60, 90], conseil: "Contrefaçons courantes : vérifier le module 3229 au dos et le poids." },
  { marque: "Casio", modele: "G-Shock GA-2100 « CasiOak »", ref: "GA-2100", achat: [50, 70], revente: [80, 110], conseil: "Coloris rares (série limitée) se revendent bien plus cher." },
  { marque: "Casio", modele: "Calculatrice CA-53W", ref: "CA-53W", achat: [15, 25], revente: [30, 45], conseil: "Touches qui collent : nettoyage du clavier." },
  { marque: "Timex", modele: "Marlin / Q Timex réédition", ref: "Q Timex", achat: [90, 130], revente: [140, 180], conseil: "Pile et joint du compartiment à contrôler sur le Q (trappe de pile)." },
  { marque: "Swatch", modele: "Vintage années 80-90", ref: "Swatch vintage", achat: [15, 40], revente: [40, 100], conseil: "Valeur selon le modèle exact : chercher le code au dos (ex. GB, GK). Remplacement de pile simple." },
  { marque: "Swatch", modele: "MoonSwatch (Omega x Swatch)", ref: "MoonSwatch", achat: [180, 220], revente: [230, 290], conseil: "Marge faible sauf coloris recherchés. Beaucoup de copies : vérifier le carton et le logo du cadran." },
  { marque: "Seiko", modele: "Seiko 5 SNK809 / SNK80x", ref: "SNK809", achat: [40, 70], revente: [80, 120], conseil: "Automatique 7S26 : vérifier qu'elle tourne et la précision. Bracelet tissu à remplacer." },
  { marque: "Seiko", modele: "Seiko 5 Sports SRPD", ref: "SRPD", achat: [120, 170], revente: [180, 240], conseil: "Très populaire pour le modding : un cadran ou une lunette de rechange peut ajouter de la valeur." },
  { marque: "Seiko", modele: "SKX007 / SKX009", ref: "SKX007", achat: [150, 220], revente: [250, 350], conseil: "Arrêtée en 2019, très recherchée. Méfiance : beaucoup de « Frankenwatch » (pièces non d'origine)." },
  { marque: "Seiko", modele: "Prospex « Turtle » SRP777", ref: "SRP777", achat: [200, 260], revente: [300, 380], conseil: "Vérifier l'alignement de la lunette, défaut connu." },
  { marque: "Seiko", modele: "Plongeuse vintage 6309 / 7002", ref: "Seiko 6309", achat: [120, 200], revente: [220, 350], conseil: "Cadrans repeints fréquents : à éviter ou à annoncer clairement." },
  { marque: "Citizen", modele: "Eco-Drive BN0150", ref: "BN0150", achat: [100, 140], revente: [150, 200], conseil: "Solaire : vérifier que la batterie tient la charge (laisser 1 jour au soleil)." },
  { marque: "Citizen", modele: "Promaster NY0040 « Fugu »", ref: "NY0040", achat: [120, 170], revente: [180, 250], conseil: "Modèle culte arrêté. Vérifier la couronne vissée." },
  { marque: "Orient", modele: "Bambino", ref: "Orient Bambino", achat: [60, 90], revente: [110, 150], conseil: "Verre bombé : rayures visibles, polissage possible." },
  { marque: "Orient", modele: "Kamasu / Mako", ref: "Orient Kamasu", achat: [120, 160], revente: [170, 230], conseil: "Bon rapport qualité-prix, se vend vite." },
  { marque: "Lip", modele: "Vintage (Nautic-Ski, Mach 2000)", ref: "Lip vintage", achat: [80, 150], revente: [150, 300], conseil: "Marque française appréciée en France. Mouvements électroniques anciens : vérifier qu'ils fonctionnent." },
  { marque: "Tissot", modele: "PRX quartz 40 mm", ref: "Tissot PRX", achat: [180, 230], revente: [250, 320], conseil: "Contrôler le numéro de série au dos et la boucle du bracelet intégré." },
  { marque: "Tissot", modele: "Visodate / Le Locle", ref: "Tissot Visodate", achat: [200, 280], revente: [300, 400], conseil: "Premier pas vers le milieu de gamme suisse. Boîte et papiers augmentent nettement le prix." },
  { marque: "Hamilton", modele: "Khaki Field Mechanical", ref: "Hamilton Khaki Field", achat: [300, 380], revente: [420, 500], conseil: "Montée en gamme : remontage manuel, vérifier la réserve de marche (80 h)." },
];

export function liensRecherche(texte) {
  const q = encodeURIComponent(texte);
  return {
    "eBay vendus": `https://www.ebay.fr/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`,
    Vinted: `https://www.vinted.fr/catalog?search_text=${q}`,
    Leboncoin: `https://www.leboncoin.fr/recherche?text=${q}`,
    Chrono24: `https://www.chrono24.fr/search/index.htm?query=${q}`,
  };
}
