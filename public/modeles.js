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
  // Casio
  { marque: "Casio", modele: "Vintage A700W (doré ou acier)", ref: "A700W", achat: [20, 35], revente: [45, 60], conseil: "Version dorée la plus demandée. Vérifier l'état du bracelet milanais." },
  { marque: "Casio", modele: "Vintage A168 doré", ref: "A168", achat: [15, 25], revente: [30, 45], conseil: "Très copiée : vérifier le poids et le fond gravé." },
  { marque: "Casio", modele: "MDV-107 « Duro »", ref: "MDV-107", achat: [40, 55], revente: [65, 90], conseil: "Même logique que la MDV-106 : lunette et bracelet faciles à remplacer." },
  { marque: "Casio", modele: "Data Bank DBC-32", ref: "DBC-32", achat: [20, 30], revente: [40, 55], conseil: "Vérifier toutes les touches et l'affichage complet." },
  { marque: "Casio", modele: "Edifice EFR-526", ref: "EFR-526", achat: [40, 60], revente: [70, 100], conseil: "Chronographe quartz : tester toutes les fonctions du chrono." },
  { marque: "Casio", modele: "G-Shock DW-6900", ref: "DW-6900", achat: [35, 50], revente: [60, 85], conseil: "Coloris rares recherchés. Bracelet et lunette souvent usés." },
  { marque: "Casio", modele: "G-Shock GW-M5610 (solaire, radio)", ref: "GW-M5610", achat: [60, 85], revente: [100, 130], conseil: "Vérifier la charge solaire et la réception radio." },
  { marque: "Casio", modele: "G-Shock GM-2100 (métal)", ref: "GM-2100", achat: [120, 160], revente: [180, 230], conseil: "Lunette acier : les rayures se voient, polissage possible." },
  { marque: "Casio", modele: "G-Shock GW-5000", ref: "GW-5000", achat: [250, 320], revente: [350, 420], conseil: "Haut de gamme G-Shock, fabriqué au Japon. Vérifier le module." },
  { marque: "Casio", modele: "Pro Trek PRW-3500", ref: "PRW-3500", achat: [80, 120], revente: [140, 180], conseil: "Tester boussole, baromètre et altimètre." },
  // Seiko
  { marque: "Seiko", modele: "Seiko 5 SNXS79 / SNXS", ref: "SNXS", achat: [50, 80], revente: [90, 130], conseil: "Petite automatique habillée, se vend vite." },
  { marque: "Seiko", modele: "Seiko 5 SNZG militaire", ref: "SNZG", achat: [70, 100], revente: [120, 160], conseil: "Vérifier le verre et l'aiguille des secondes." },
  { marque: "Seiko", modele: "Seiko 5 Sports SRPE", ref: "SRPE", achat: [120, 170], revente: [180, 240], conseil: "Comme les SRPD : modding apprécié." },
  { marque: "Seiko", modele: "Monster SRP307 / SRPD27", ref: "Seiko Monster", achat: [150, 210], revente: [230, 300], conseil: "Lume très fort : vérifier qu'il n'a pas été refait." },
  { marque: "Seiko", modele: "Presage Cocktail Time SRPB", ref: "Seiko Cocktail Time", achat: [200, 260], revente: [300, 380], conseil: "Cadran fragile aux reflets : demander des photos en lumière naturelle." },
  { marque: "Seiko", modele: "SARB033 / SARB035", ref: "SARB033", achat: [280, 350], revente: [400, 500], conseil: "Arrêtée et recherchée. Vérifier le numéro de série et le mouvement 6R15." },
  { marque: "Seiko", modele: "Kinetic plongeuse SKA371", ref: "SKA371", achat: [100, 150], revente: [170, 230], conseil: "Le condensateur Kinetic est souvent à changer : à prévoir dans le coût." },
  { marque: "Seiko", modele: "Vintage Seiko 5 7009", ref: "Seiko 7009", achat: [30, 60], revente: [70, 120], conseil: "Cadrans d'époque recherchés, éviter les cadrans repeints." },
  { marque: "Seiko", modele: "Vintage Seiko 6119", ref: "Seiko 6119", achat: [40, 70], revente: [80, 130], conseil: "Révision souvent nécessaire : vérifier la précision." },
  { marque: "Seiko", modele: "Vintage chronographe 6139 « Pogue »", ref: "Seiko 6139", achat: [300, 450], revente: [450, 650], conseil: "Montée en gamme. Beaucoup de pièces refaites : vérifier lunette et cadran d'origine." },
  // Citizen, Orient
  { marque: "Citizen", modele: "Tsuyosa NJ0150", ref: "Citizen Tsuyosa", achat: [180, 230], revente: [250, 310], conseil: "Coloris vert et turquoise les plus demandés." },
  { marque: "Citizen", modele: "Eco-Drive Chandler BM8180", ref: "BM8180", achat: [80, 110], revente: [130, 170], conseil: "Solaire : vérifier qu'elle se recharge bien." },
  { marque: "Citizen", modele: "Vintage chronographe « Bullhead » 8110", ref: "Citizen Bullhead", achat: [200, 300], revente: [300, 450], conseil: "Rare et recherché, vérifier que le chrono fonctionne." },
  { marque: "Orient", modele: "Ray II", ref: "Orient Ray", achat: [80, 110], revente: [130, 170], conseil: "Alternative à la Seiko SKX, se vend bien." },
  { marque: "Orient", modele: "Orient Star", ref: "Orient Star", achat: [200, 280], revente: [300, 380], conseil: "Gamme supérieure d'Orient : vérifier l'indicateur de réserve de marche." },
  // Timex, Swatch
  { marque: "Timex", modele: "Marlin remontage manuel", ref: "Timex Marlin", achat: [100, 140], revente: [150, 190], conseil: "Verre bombé en plexi : rayures faciles à polir." },
  { marque: "Timex", modele: "Weekender", ref: "Timex Weekender", achat: [15, 25], revente: [35, 50], conseil: "Petite marge mais se vend très vite. Pile et bracelet tissu." },
  { marque: "Swatch", modele: "Sistem51", ref: "Sistem51", achat: [50, 70], revente: [80, 110], conseil: "Automatique non réparable : vérifier qu'elle fonctionne bien." },
  { marque: "Swatch", modele: "Irony (acier)", ref: "Swatch Irony", achat: [20, 35], revente: [40, 60], conseil: "Chronographes Irony plus recherchés que les 3 aiguilles." },
  // Montres françaises et de l'Est
  { marque: "Lip", modele: "Himalaya", ref: "Lip Himalaya", achat: [60, 100], revente: [120, 170], conseil: "Modèle iconique français, bon public sur Vinted." },
  { marque: "Lip", modele: "Général de Gaulle T18", ref: "Lip Gaulle", achat: [70, 110], revente: [130, 180], conseil: "Rééditions courantes : distinguer vintage et réédition." },
  { marque: "Yema", modele: "Vintage (Superman, Navygraf…)", ref: "Yema vintage", achat: [80, 150], revente: [150, 280], conseil: "Valeur très variable selon le modèle : vérifier les ventes terminées." },
  { marque: "Vostok", modele: "Amphibia", ref: "Vostok Amphibia", achat: [30, 50], revente: [60, 90], conseil: "Couronne non vissée normale sur ce modèle. Lunette souvent à changer." },
  { marque: "Raketa", modele: "Vintage soviétique", ref: "Raketa", achat: [30, 50], revente: [60, 100], conseil: "Cadrans rares (24 h, Big Zero) beaucoup plus chers." },
  { marque: "Poljot", modele: "Chronographe 3133 (Sturmanskie, Okeah)", ref: "Poljot 3133", achat: [100, 150], revente: [170, 250], conseil: "Vérifier le chrono et la remise à zéro." },
  // Suisses et milieu de gamme
  { marque: "Tissot", modele: "Seastar 1000 quartz", ref: "Tissot Seastar", achat: [150, 200], revente: [220, 280], conseil: "Vérifier l'étanchéité si possible et l'état de la lunette." },
  { marque: "Tissot", modele: "Vintage PR 516", ref: "Tissot PR516", achat: [100, 180], revente: [200, 300], conseil: "Années 60-70 recherchées. Cadrans repeints fréquents." },
  { marque: "Tissot", modele: "T-Touch", ref: "Tissot T-Touch", achat: [150, 220], revente: [250, 330], conseil: "Tester toutes les fonctions tactiles avant d'acheter." },
  { marque: "Tissot", modele: "Gentleman Powermatic 80", ref: "Tissot Gentleman", achat: [350, 450], revente: [480, 580], conseil: "Montée en gamme : boîte et papiers font la différence." },
  { marque: "Certina", modele: "DS Action", ref: "Certina DS Action", achat: [250, 330], revente: [380, 460], conseil: "Plongeuse suisse sous-cotée, bonne revente." },
  { marque: "Victorinox", modele: "Swiss Army", ref: "Victorinox", achat: [80, 120], revente: [140, 190], conseil: "Modèles Maverick et Infantry les plus demandés." },
  { marque: "Bulova", modele: "Lunar Pilot", ref: "Bulova Lunar Pilot", achat: [200, 260], revente: [300, 370], conseil: "Quartz haute fréquence : trotteuse fluide à vérifier." },
  { marque: "Bulova", modele: "Accutron vintage (diapason)", ref: "Bulova Accutron", achat: [150, 250], revente: [250, 400], conseil: "Doit faire un léger bourdonnement : sinon révision coûteuse." },
  { marque: "Hamilton", modele: "Jazzmaster", ref: "Hamilton Jazzmaster", achat: [300, 400], revente: [420, 520], conseil: "Montée en gamme, automatique de préférence." },
  { marque: "Omega", modele: "De Ville vintage", ref: "Omega De Ville", achat: [250, 350], revente: [400, 550], conseil: "Montée en gamme. Contrefaçons nombreuses : mouvement visible et numéro de série obligatoires." },
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

// Surveillance eBay proposée pour un modèle : on vise le milieu de la fourchette de revente
// et on ignore les annonces au-dessus du prix d'achat maximum.
export function surveillanceDepuisModele(m) {
  const motsCles = m.ref.toLowerCase().includes(m.marque.toLowerCase()) ? m.ref : `${m.marque} ${m.ref}`;
  return {
    id: crypto.randomUUID(),
    nom: `${m.marque} ${m.modele}`,
    motsCles,
    exclus: "",
    prixRevente: Math.round((m.revente[0] + m.revente[1]) / 2),
    prixMax: m.achat[1],
    active: true,
  };
}
