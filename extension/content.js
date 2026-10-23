// Sur une annonce Vinted, Leboncoin ou eBay : reconnaît le modèle parmi tes surveillances,
// et affiche un encadré avec le prix de revente estimé et la marge.
(() => {
  const PAGES_ANNONCE = [/vinted\.fr\/items\/\d+/, /leboncoin\.fr\/(ad\/|.*\d+\.htm)/, /ebay\.fr\/itm\//];
  const SELECTEURS_PRIX = ['[data-testid="item-price"]', '[data-qa-id="adview_price"]', ".x-price-primary", '[itemprop="price"]'];
  const SELECTEURS_TITRE = ['h1[data-qa-id="adview_title"]', "h1.x-item-title__mainTitle", "h1"];
  const SELECTEURS_MARQUE = ['[itemprop="brand"]', '[data-testid="item-attributes-brand"]'];
  let analyse = null;
  let derniereUrl = "";

  const texte = (sel) => document.querySelector(sel)?.textContent?.trim() || "";
  const meta = (nom) => document.querySelector(`meta[property="${nom}"], meta[name="${nom}"], meta[itemprop="${nom}"]`)?.content || "";
  const euros = (n) => `${Math.round(n)} €`;

  function lirePrix(brut) {
    const m = String(brut).replace(/\s| | /g, "").match(/\d+(?:[.,]\d{1,2})?/);
    return m ? parseFloat(m[0].replace(",", ".")) : 0;
  }

  function prixJsonLd() {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const objets = [].concat(JSON.parse(s.textContent));
        for (const o of objets.flatMap((x) => x["@graph"] || [x])) {
          const offre = [].concat(o.offers || [])[0];
          if (offre?.price) return parseFloat(offre.price);
        }
      } catch {}
    }
    return 0;
  }

  function lireAnnonce() {
    const titre = SELECTEURS_TITRE.map(texte).find(Boolean) || meta("og:title") || document.title;
    const marque = SELECTEURS_MARQUE.map(texte).find(Boolean) || "";
    let prix = prixJsonLd() || lirePrix(meta("product:price:amount"));
    if (!prix) prix = SELECTEURS_PRIX.map((s) => lirePrix(texte(s))).find((p) => p > 0) || 0;
    return { titre, marque, prix };
  }

  // Frais payés par l'acheteur en plus du prix (approximation de la protection acheteurs Vinted).
  function fraisAchat(prix) {
    return location.hostname.includes("vinted") ? Math.round((0.7 + prix * 0.05) * 100) / 100 : 0;
  }

  function encadre() {
    let hote = document.getElementById("itech-montres");
    if (!hote) {
      hote = document.createElement("div");
      hote.id = "itech-montres";
      hote.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647";
      hote.attachShadow({ mode: "open" });
      document.body.appendChild(hote);
    }
    return hote.shadowRoot;
  }

  function afficher(contenu, couleur = "#1f5f8b") {
    const racine = encadre();
    racine.innerHTML = `
      <style>
        .boite { font: 14px/1.4 system-ui, sans-serif; width: 270px; background: #fff; color: #1d1d1f; border-radius: 12px;
          box-shadow: 0 6px 24px rgb(0 0 0 / .25); border-top: 5px solid ${couleur}; padding: 12px 14px; }
        .titre { display: flex; justify-content: space-between; font-weight: 650; margin-bottom: 6px; }
        .fermer { cursor: pointer; border: 0; background: none; font-size: 16px; color: #6b6b70; }
        .ligne { display: flex; justify-content: space-between; gap: 8px; }
        .total { font-weight: 700; font-size: 16px; border-top: 1px solid #ddd; margin-top: 6px; padding-top: 6px; }
        .verdict { font-weight: 700; color: ${couleur}; margin: 4px 0 8px; }
        .discret { color: #6b6b70; font-size: 12px; }
        a { color: #1f5f8b; }
      </style>
      <div class="boite"><div class="titre"><span>⌚ iTech Montres</span><button class="fermer" title="Fermer">✕</button></div>${contenu}</div>`;
    racine.querySelector(".fermer").onclick = () => document.getElementById("itech-montres")?.remove();
  }

  const lienVendus = (q) => `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`;

  async function analyser() {
    if (!PAGES_ANNONCE.some((re) => re.test(location.href))) {
      document.getElementById("itech-montres")?.remove();
      return;
    }
    analyse ||= await import(chrome.runtime.getURL("analyse.mjs"));
    const { titre, marque, prix } = lireAnnonce();
    if (!titre) return;

    const reponse = await chrome.runtime.sendMessage({ type: "reglages" });
    if (reponse.erreur) {
      afficher(`<p class="discret">${reponse.erreur}</p>`, "#a45a00");
      return;
    }
    const r = reponse.reglages;
    const exclus = r.veille?.exclus ? r.veille.exclus.split(",") : analyse.EXCLUS_DEFAUT;
    const surveillances = r.surveillances || [];
    const s =
      analyse.trouverSurveillance(titre, surveillances, exclus) ||
      (marque && analyse.trouverSurveillance(`${marque} ${titre}`, surveillances, exclus));

    if (!s) {
      afficher(`<p>Modèle non reconnu parmi tes ${surveillances.length} modèles surveillés.</p>
        <a href="${lienVendus(titre)}" target="_blank">Voir les ventes terminées eBay</a>`, "#6b6b70");
      return;
    }
    if (!prix) {
      afficher(`<p><b>${s.nom || s.motsCles}</b></p><p class="discret">Prix introuvable sur cette page.</p>`, "#a45a00");
      return;
    }

    const plateforme = (r.plateformes || []).find((p) => p.nom === (r.veille?.plateformeRevente || "Vinted")) || { pct: 0, fixe: 0 };
    const frais = fraisAchat(prix);
    const { marge, margePct } = analyse.estimerMarge({ prix, port: frais, prixRevente: s.prixRevente, plateforme, cotisations: r.cotisations || 0 });
    const seuil = r.veille?.margeMin ?? 20;
    const [verdict, couleur] = marge >= seuil ? ["✓ Bonne affaire", "#1e7a46"] : marge > 0 ? ["≈ Marge faible", "#a45a00"] : ["✗ Pas rentable", "#b3261e"];
    const prixMaxConseille = s.prixRevente - seuil - frais - (s.prixRevente * (plateforme.pct || 0)) / 100 - (plateforme.fixe || 0) - (s.prixRevente * (r.cotisations || 0)) / 100;

    afficher(
      `<div><b>${s.nom || s.motsCles}</b></div>
      <div class="verdict">${verdict}</div>
      <div class="ligne"><span>Prix annonce</span><span>${euros(prix)}</span></div>
      ${frais ? `<div class="ligne"><span>Frais acheteur ≈</span><span>${euros(frais)}</span></div>` : ""}
      <div class="ligne"><span>Revente estimée</span><span>${euros(s.prixRevente)}</span></div>
      <div class="ligne total"><span>Marge nette</span><span>${euros(marge)} (${Math.round(margePct)} %)</span></div>
      <p class="discret">Hors port. Pour ${euros(seuil)} de marge, ne paie pas plus de <b>${euros(Math.max(0, prixMaxConseille))}</b>.</p>
      <a href="${lienVendus(s.motsCles)}" target="_blank">Vérifier les ventes terminées eBay</a>`,
      couleur
    );
  }

  // Vinted et Leboncoin changent de page sans recharger : on surveille l'adresse.
  setInterval(() => {
    if (location.href !== derniereUrl) {
      derniereUrl = location.href;
      setTimeout(() => analyser().catch((e) => console.warn("iTech Montres :", e)), 1200);
    }
  }, 800);
})();
