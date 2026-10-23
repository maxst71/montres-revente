import { MODELES, liensRecherche, surveillanceDepuisModele } from "./modeles.js";

const STATUTS = ["En stock", "En réparation", "En vente", "Vendue"];
const PAIEMENTS = ["Espèces", "Virement", "Carte", "Chèque", "Via la plateforme"];

const REGLAGES_DEFAUT = {
  plateformes: [
    { nom: "Vinted", pct: 0, fixe: 0 },
    { nom: "Leboncoin", pct: 0, fixe: 0 },
    { nom: "eBay", pct: 13, fixe: 0.35 },
    { nom: "Chrono24", pct: 6.5, fixe: 0 },
    { nom: "Main propre", pct: 0, fixe: 0 },
  ],
  cotisations: 12.3,
  margeCible: 30,
  prochainNumero: 1,
  surveillances: [],
  veille: { margeMin: 20, plateformeRevente: "Vinted" },
};

let donnees = { montres: [], reglages: structuredClone(REGLAGES_DEFAUT) };
let motDePasse = "";

// ---------- Outils ----------

const $ = (sel, racine = document) => racine.querySelector(sel);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const euros = (n) => num(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const pct = (n) => `${num(n).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dateFr = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR") : "");
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const classeSigne = (n) => (n >= 0 ? "positif" : "negatif");
const memoriser = (cle, valeur) => {
  try {
    valeur === null ? localStorage.removeItem(cle) : localStorage.setItem(cle, valeur);
  } catch {}
};
const relire = (cle) => {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
};

function plateforme(nom) {
  return donnees.reglages.plateformes.find((p) => p.nom === nom) || { nom, pct: 0, fixe: 0 };
}

function fraisPlateforme(nom, prix) {
  const p = plateforme(nom);
  return prix > 0 ? (prix * num(p.pct)) / 100 + num(p.fixe) : 0;
}

function coutRevient(m) {
  return num(m.prixAchat) + num(m.portAchat) + num(m.fraisPieces);
}

function beneficeVente(m) {
  const pv = num(m.prixVente);
  const frais = fraisPlateforme(m.plateformeVente, pv);
  const cotis = (pv * num(donnees.reglages.cotisations)) / 100;
  return pv - coutRevient(m) - frais - num(m.portVente) - cotis;
}

// ---------- Serveur ----------

async function api(chemin, options = {}) {
  const r = await fetch(`/api/${chemin}`, {
    ...options,
    headers: { "content-type": "application/json", "x-password": motDePasse, ...(options.headers || {}) },
  });
  const corps = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(corps.erreur || `Erreur ${r.status}`), { status: r.status });
  return corps;
}

let minuterie = null;
function sauvegarder() {
  memoriser("montres-cache", JSON.stringify(donnees));
  $("#etat-sauvegarde").textContent = "Enregistrement…";
  clearTimeout(minuterie);
  minuterie = setTimeout(async () => {
    try {
      await api("donnees", { method: "PUT", body: JSON.stringify(donnees) });
      $("#etat-sauvegarde").textContent = "Enregistré ✓";
    } catch (e) {
      $("#etat-sauvegarde").textContent = "⚠ Non enregistré : " + e.message;
    }
  }, 600);
}

async function connexion(mdp) {
  motDePasse = mdp;
  const { data } = await api("donnees");
  if (data) {
    donnees = data;
    donnees.reglages = { ...structuredClone(REGLAGES_DEFAUT), ...data.reglages };
  }
  memoriser("montres-mdp", mdp);
  $("#ecran-login").hidden = true;
  $("#app").hidden = false;
  afficherTout();
  chargerVeille();
}

// ---------- Navigation ----------

function changerOnglet(nom) {
  document.querySelectorAll("#onglets button").forEach((b) => b.classList.toggle("actif", b.dataset.onglet === nom));
  document.querySelectorAll(".onglet").forEach((s) => (s.hidden = s.id !== nom));
  memoriser("montres-onglet", nom);
}

function afficherTout() {
  afficherAffaires();
  afficherTableau();
  afficherCalcul();
  afficherStock();
  afficherRegistre();
  afficherModeles();
  afficherReglages();
}

// ---------- Tableau de bord ----------

function afficherTableau() {
  const ms = donnees.montres;
  const enStock = ms.filter((m) => m.statut !== "Vendue");
  const vendues = ms.filter((m) => m.statut === "Vendue");
  const mois = aujourdhui().slice(0, 7);
  const venduesMois = vendues.filter((m) => (m.dateVente || "").startsWith(mois));
  const benefMois = venduesMois.reduce((s, m) => s + beneficeVente(m), 0);
  const caMois = venduesMois.reduce((s, m) => s + num(m.prixVente), 0);
  const benefTotal = vendues.reduce((s, m) => s + beneficeVente(m), 0);
  const capital = enStock.reduce((s, m) => s + coutRevient(m), 0);
  const margeMoy = vendues.length
    ? vendues.reduce((s, m) => s + (num(m.prixVente) ? beneficeVente(m) / num(m.prixVente) : 0), 0) / vendues.length * 100
    : 0;
  const delais = vendues
    .filter((m) => m.dateAchat && m.dateVente)
    .map((m) => (new Date(m.dateVente) - new Date(m.dateAchat)) / 86400000);
  const delaiMoy = delais.length ? delais.reduce((a, b) => a + b, 0) / delais.length : 0;
  const caAnnee = vendues
    .filter((m) => (m.dateVente || "").startsWith(aujourdhui().slice(0, 4)))
    .reduce((s, m) => s + num(m.prixVente), 0);

  const chiffre = (libelle, valeur, classe = "") =>
    `<div class="chiffre"><div class="valeur ${classe}">${valeur}</div><div class="libelle">${libelle}</div></div>`;

  const anciennes = enStock
    .filter((m) => m.dateAchat && (Date.now() - new Date(m.dateAchat)) / 86400000 > 30)
    .sort((a, b) => a.dateAchat.localeCompare(b.dateAchat));

  $("#tableau").innerHTML = `
    <h2>Tableau de bord</h2>
    <div class="grille">
      ${chiffre("Bénéfice net ce mois-ci", euros(benefMois), classeSigne(benefMois))}
      ${chiffre("Chiffre d'affaires ce mois-ci", euros(caMois))}
      ${chiffre("Montres en stock", enStock.length)}
      ${chiffre("Argent immobilisé dans le stock", euros(capital))}
      ${chiffre("Bénéfice net total", euros(benefTotal), classeSigne(benefTotal))}
      ${chiffre("Marge nette moyenne", pct(margeMoy))}
      ${chiffre("Délai moyen de revente", `${Math.round(delaiMoy)} j`)}
      ${chiffre(`Chiffre d'affaires ${aujourdhui().slice(0, 4)}`, euros(caAnnee))}
    </div>
    <div class="actions"><button id="tb-ajouter">+ Ajouter une montre achetée</button>
      <button class="secondaire" data-aller="calcul">Calculer une affaire</button></div>
    ${
      anciennes.length
        ? `<div class="carte"><h3>En stock depuis plus de 30 jours</h3>
           <p class="discret">Pense à baisser le prix ou à changer de plateforme.</p>
           <ul>${anciennes.map((m) => `<li>${esc(m.marque)} ${esc(m.modele)} : achetée le ${dateFr(m.dateAchat)}</li>`).join("")}</ul></div>`
        : ""
    }
    <p class="discret">Les bénéfices sont calculés après frais de plateforme, port et cotisations URSSAF (${pct(donnees.reglages.cotisations)}).</p>`;
  $("#tb-ajouter").onclick = () => ouvrirMontre();
}

// ---------- Calculateur ----------

function afficherCalcul() {
  const options = donnees.reglages.plateformes.map((p) => `<option>${esc(p.nom)}</option>`).join("");
  $("#calcul").innerHTML = `
    <h2>Calculateur d'affaire</h2>
    <p class="discret">Avant d'acheter : est-ce que cette montre vaut le coup ?</p>
    <div class="carte form-grille" id="calc-form">
      <label>Prix demandé par le vendeur <input inputmode="decimal" name="achat" placeholder="ex. 60"></label>
      <label>Port à l'achat <input inputmode="decimal" name="portAchat" placeholder="0"></label>
      <label>Pièces et réparation (pile, bracelet…) <input inputmode="decimal" name="pieces" placeholder="ex. 8"></label>
      <label>Prix de revente visé <input inputmode="decimal" name="revente" placeholder="ex. 110"></label>
      <label>Plateforme de revente <select name="plateforme">${options}</select></label>
      <label>Port payé par toi à la vente <input inputmode="decimal" name="portVente" placeholder="0"></label>
      <label>Marge nette visée (% du prix de revente) <input inputmode="decimal" name="cible" value="${donnees.reglages.margeCible}"></label>
    </div>
    <div class="carte" id="calc-resultat"></div>`;
  const form = $("#calc-form");
  const calculer = () => {
    const v = Object.fromEntries([...form.querySelectorAll("input,select")].map((i) => [i.name, i.value]));
    const pv = num(v.revente);
    const frais = fraisPlateforme(v.plateforme, pv);
    const cotis = (pv * num(donnees.reglages.cotisations)) / 100;
    const cout = num(v.achat) + num(v.portAchat) + num(v.pieces);
    const benef = pv - cout - frais - num(v.portVente) - cotis;
    const marge = pv ? (benef / pv) * 100 : 0;
    const p = plateforme(v.plateforme);
    const maxAchat =
      pv * (1 - num(p.pct) / 100 - num(donnees.reglages.cotisations) / 100 - num(v.cible) / 100) -
      (pv ? num(p.fixe) : 0) - num(v.portVente) - num(v.pieces) - num(v.portAchat);
    const verdict = !pv || !num(v.achat)
      ? `<p class="discret">Renseigne au moins le prix demandé et le prix de revente visé.</p>`
      : marge >= num(v.cible)
        ? `<p class="positif">✓ Bonne affaire : la marge atteint ton objectif.</p>`
        : benef > 0
          ? `<p style="color:var(--orange);font-weight:600">≈ Rentable mais sous ton objectif : négocie à ${euros(Math.max(0, maxAchat))} maximum.</p>`
          : `<p class="negatif">✗ Pas rentable à ce prix.</p>`;
    $("#calc-resultat").innerHTML = `
      ${verdict}
      <div class="resultat">
        <span>Prix de revente</span><span>${euros(pv)}</span>
        <span>Coût d'achat (prix + port + pièces)</span><span>− ${euros(cout)}</span>
        <span>Frais ${esc(v.plateforme)} (${pct(p.pct)}${num(p.fixe) ? " + " + euros(p.fixe) : ""})</span><span>− ${euros(frais)}</span>
        <span>Port à la vente</span><span>− ${euros(v.portVente)}</span>
        <span>Cotisations URSSAF (${pct(donnees.reglages.cotisations)})</span><span>− ${euros(cotis)}</span>
        <span class="total">Bénéfice net</span><span class="total ${classeSigne(benef)}">${euros(benef)} (${pct(marge)})</span>
        <span>Prix d'achat maximum pour ${pct(v.cible)} de marge</span><span><strong>${euros(Math.max(0, maxAchat))}</strong></span>
      </div>`;
  };
  form.addEventListener("input", calculer);
  calculer();
}

// ---------- Stock ----------

function badgeStatut(s) {
  const classe = { Vendue: "vendue", "En réparation": "reparation", "En vente": "vente" }[s] || "";
  return `<span class="badge ${classe}">${esc(s)}</span>`;
}

function afficherStock() {
  const filtre = relire("montres-filtre") || "actives";
  const recherche = (relire("montres-recherche") || "").toLowerCase();
  let liste = [...donnees.montres].sort((a, b) => b.numero - a.numero);
  if (filtre === "actives") liste = liste.filter((m) => m.statut !== "Vendue");
  if (filtre === "vendues") liste = liste.filter((m) => m.statut === "Vendue");
  if (recherche) liste = liste.filter((m) => `${m.marque} ${m.modele} ${m.reference}`.toLowerCase().includes(recherche));

  $("#stock").innerHTML = `
    <h2>Stock</h2>
    <div class="actions">
      <button id="stock-ajouter">+ Ajouter une montre</button>
      <select id="stock-filtre" style="width:auto">
        <option value="actives">Pas encore vendues</option>
        <option value="vendues">Vendues</option>
        <option value="toutes">Toutes</option>
      </select>
      <input id="stock-recherche" placeholder="Rechercher…" style="width:auto;flex:1;min-width:140px" value="${esc(recherche)}">
      <button class="secondaire" id="stock-csv">Exporter (CSV)</button>
    </div>
    ${
      liste.length
        ? `<div class="carte tableau-defile"><table>
          <thead><tr><th>N°</th><th>Montre</th><th>Statut</th><th>Achat</th><th class="nombre">Coût</th><th class="nombre">Vente</th><th class="nombre">Bénéfice</th></tr></thead>
          <tbody>${liste
            .map((m) => {
              const vendue = m.statut === "Vendue";
              const b = beneficeVente(m);
              return `<tr class="cliquable" data-id="${m.id}">
                <td>${m.numero}</td>
                <td><strong>${esc(m.marque)} ${esc(m.modele)}</strong><br><span class="discret">${esc(m.reference)}</span></td>
                <td>${badgeStatut(m.statut)}</td>
                <td>${dateFr(m.dateAchat)}</td>
                <td class="nombre">${euros(coutRevient(m))}</td>
                <td class="nombre">${vendue ? euros(m.prixVente) : m.prixAffiche ? `<span class="discret">affichée ${euros(m.prixAffiche)}</span>` : ""}</td>
                <td class="nombre ${vendue ? classeSigne(b) : ""}">${vendue ? euros(b) : ""}</td>
              </tr>`;
            })
            .join("")}</tbody></table></div>`
        : `<div class="carte"><p>Aucune montre ici pour l'instant.</p></div>`
    }`;
  $("#stock-filtre").value = filtre;
  $("#stock-filtre").onchange = (e) => {
    memoriser("montres-filtre", e.target.value);
    afficherStock();
  };
  $("#stock-recherche").oninput = (e) => {
    memoriser("montres-recherche", e.target.value);
    clearTimeout(afficherStock.t);
    afficherStock.t = setTimeout(() => {
      afficherStock();
      const champ = $("#stock-recherche");
      champ.focus();
      champ.setSelectionRange(champ.value.length, champ.value.length);
    }, 300);
  };
  $("#stock-ajouter").onclick = () => ouvrirMontre();
  $("#stock-csv").onclick = exporterStock;
  document.querySelectorAll("#stock tr[data-id]").forEach((tr) => (tr.onclick = () => ouvrirMontre(tr.dataset.id)));
}

function champ(nom, libelle, m, type = "text", extra = "") {
  const val = m[nom] ?? "";
  return `<label>${libelle}<input name="${nom}" type="${type}" value="${esc(val)}" ${type === "number" ? 'step="0.01" inputmode="decimal"' : ""} ${extra}></label>`;
}
function liste(nom, libelle, m, choix) {
  return `<label>${libelle}<select name="${nom}">${choix
    .map((c) => `<option ${c === m[nom] ? "selected" : ""}>${esc(c)}</option>`)
    .join("")}</select></label>`;
}

function ouvrirMontre(id, preRemplissage = {}) {
  const existante = donnees.montres.find((m) => m.id === id);
  const m = existante || { statut: "En stock", dateAchat: aujourdhui(), paiementAchat: "Via la plateforme", plateformeAchat: "Vinted", ...preRemplissage };
  const plats = donnees.reglages.plateformes.map((p) => p.nom);
  const dlg = $("#dialogue-montre");
  const form = $("#form-montre");
  form.innerHTML = `
    <h2>${existante ? `Montre n° ${m.numero}` : "Nouvelle montre"}</h2>
    <fieldset><legend>La montre</legend><div class="form-grille">
      ${champ("marque", "Marque *", m, "text", "required")}
      ${champ("modele", "Modèle *", m, "text", "required")}
      ${champ("reference", "Référence", m)}
      ${champ("numeroSerie", "N° de série", m)}
      ${champ("etat", "État (ex. très bon, rayures…)", m)}
      ${liste("statut", "Statut", m, STATUTS)}
    </div>
    <label style="margin-top:12px">Description / notes<textarea name="notes">${esc(m.notes)}</textarea></label></fieldset>

    <fieldset><legend>Achat</legend><div class="form-grille">
      ${champ("dateAchat", "Date d'achat *", m, "date", "required")}
      ${champ("prixAchat", "Prix d'achat *", m, "number", "required")}
      ${champ("portAchat", "Port payé", m, "number")}
      ${champ("fraisPieces", "Pièces et réparation", m, "number")}
      ${liste("plateformeAchat", "Achetée sur", m, [...plats, "Brocante / vide-grenier", "Autre"])}
      ${liste("paiementAchat", "Moyen de paiement", m, PAIEMENTS)}
    </div></fieldset>

    <fieldset><legend>Vendeur (pour le registre de police)</legend><div class="form-grille">
      ${champ("vendeurNom", "Nom et prénom", m)}
      ${champ("vendeurAdresse", "Adresse", m)}
      ${champ("vendeurPiece", "Pièce d'identité (type, n°, date, autorité)", m)}
      ${champ("vendeurPseudo", "Pseudo sur la plateforme", m)}
    </div></fieldset>

    <fieldset><legend>Vente</legend><div class="form-grille">
      ${champ("prixAffiche", "Prix affiché", m, "number")}
      ${liste("plateformeVente", "Vendue sur", m, plats)}
      ${champ("prixVente", "Prix de vente final", m, "number")}
      ${champ("portVente", "Port payé par toi", m, "number")}
      ${champ("dateVente", "Date de vente", m, "date")}
    </div>
    <p id="apercu-benef" class="discret"></p></fieldset>

    <div class="actions">
      <button type="submit" value="ok">Enregistrer</button>
      <button type="button" class="secondaire" id="dlg-annuler">Annuler</button>
      ${existante && m.statut !== "Vendue" ? `<button type="button" class="secondaire" id="dlg-vendue">Marquer vendue aujourd'hui</button>` : ""}
      ${existante ? `<button type="button" class="danger" id="dlg-supprimer">Supprimer</button>` : ""}
    </div>
    <div class="liens pas-imprimer" id="dlg-liens"></div>`;

  const lire = () => Object.fromEntries(new FormData(form).entries());
  const majApercu = () => {
    const v = lire();
    const b = beneficeVente(v);
    $("#apercu-benef").innerHTML = num(v.prixVente)
      ? `Bénéfice net : <span class="${classeSigne(b)}">${euros(b)}</span>`
      : `Coût de revient : ${euros(coutRevient(v))}`;
    const texte = [v.marque, v.reference || v.modele].filter(Boolean).join(" ");
    $("#dlg-liens").innerHTML = texte
      ? "Vérifier le prix : " + Object.entries(liensRecherche(texte)).map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join(" · ")
      : "";
  };
  form.oninput = majApercu;
  majApercu();

  $("#dlg-annuler").onclick = () => dlg.close();
  if ($("#dlg-vendue")) {
    $("#dlg-vendue").onclick = () => {
      form.statut.value = "Vendue";
      form.dateVente.value = aujourdhui();
      if (!form.prixVente.value) form.prixVente.value = form.prixAffiche.value;
      majApercu();
      form.prixVente.focus();
    };
  }
  if ($("#dlg-supprimer")) {
    $("#dlg-supprimer").onclick = () => {
      if (!confirm("Supprimer cette montre ? Elle disparaîtra aussi du registre de police.")) return;
      donnees.montres = donnees.montres.filter((x) => x.id !== m.id);
      dlg.close();
      sauvegarder();
      afficherTout();
    };
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const v = lire();
    if (v.statut === "Vendue" && !v.dateVente) v.dateVente = aujourdhui();
    if (existante) {
      Object.assign(existante, v);
    } else {
      donnees.montres.push({ ...v, id: crypto.randomUUID(), numero: donnees.reglages.prochainNumero++, creeLe: new Date().toISOString() });
    }
    dlg.close();
    sauvegarder();
    afficherTout();
  };
  dlg.showModal();
}

function telechargerCsv(nomFichier, lignes) {
  const csv = lignes.map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(lien.href);
}

function exporterStock() {
  const decimal = (n) => num(n).toFixed(2).replace(".", ",");
  telechargerCsv(`stock-montres-${aujourdhui()}.csv`, [
    ["N°", "Marque", "Modèle", "Référence", "N° série", "Statut", "Date achat", "Prix achat", "Port achat", "Pièces", "Coût de revient", "Plateforme vente", "Date vente", "Prix vente", "Port vente", "Bénéfice net"],
    ...donnees.montres
      .sort((a, b) => a.numero - b.numero)
      .map((m) => [m.numero, m.marque, m.modele, m.reference, m.numeroSerie, m.statut, m.dateAchat, decimal(m.prixAchat), decimal(m.portAchat), decimal(m.fraisPieces), decimal(coutRevient(m)), m.statut === "Vendue" ? m.plateformeVente : "", m.dateVente, m.statut === "Vendue" ? decimal(m.prixVente) : "", decimal(m.portVente), m.statut === "Vendue" ? decimal(beneficeVente(m)) : ""]),
  ]);
}

// ---------- Registre de police ----------

function afficherRegistre() {
  const liste = [...donnees.montres].sort((a, b) => a.numero - b.numero);
  const manquants = liste.filter((m) => !m.vendeurNom || !m.vendeurAdresse || !m.vendeurPiece);
  $("#registre").innerHTML = `
    <h2>Registre de police (objets mobiliers)</h2>
    <p class="discret pas-imprimer">Obligatoire pour un revendeur d'objets d'occasion : chaque achat est numéroté dans l'ordre, sans blanc ni rature.
    Les numéros sont attribués automatiquement et ne sont jamais réutilisés.</p>
    ${manquants.length ? `<p class="erreur pas-imprimer">⚠ ${manquants.length} achat(s) sans identité complète du vendeur : n° ${manquants.map((m) => m.numero).join(", ")}.</p>` : ""}
    <div class="actions">
      <button id="reg-imprimer">Imprimer / PDF</button>
      <button class="secondaire" id="reg-csv">Exporter (CSV)</button>
    </div>
    <div class="carte tableau-defile"><table>
      <thead><tr><th>N°</th><th>Date</th><th>Description de l'objet</th><th class="nombre">Prix</th><th>Paiement</th><th>Vendeur</th><th>Pièce d'identité</th></tr></thead>
      <tbody>${liste
        .map(
          (m) => `<tr>
          <td>${m.numero}</td><td>${dateFr(m.dateAchat)}</td>
          <td>Montre ${esc(m.marque)} ${esc(m.modele)}${m.reference ? `, réf. ${esc(m.reference)}` : ""}${m.numeroSerie ? `, n° série ${esc(m.numeroSerie)}` : ""}${m.etat ? `, ${esc(m.etat)}` : ""}</td>
          <td class="nombre">${euros(m.prixAchat)}</td><td>${esc(m.paiementAchat)}</td>
          <td>${esc(m.vendeurNom)}<br><span class="discret">${esc(m.vendeurAdresse)}${m.vendeurPseudo ? ` (${esc(m.plateformeAchat)} : ${esc(m.vendeurPseudo)})` : ""}</span></td>
          <td>${esc(m.vendeurPiece)}</td></tr>`
        )
        .join("")}</tbody></table></div>`;
  $("#reg-imprimer").onclick = () => window.print();
  $("#reg-csv").onclick = () =>
    telechargerCsv(`registre-police-${aujourdhui()}.csv`, [
      ["N° d'ordre", "Date d'achat", "Description", "Prix", "Moyen de paiement", "Vendeur", "Adresse", "Pièce d'identité", "Plateforme", "Pseudo"],
      ...liste.map((m) => [m.numero, m.dateAchat, `Montre ${m.marque} ${m.modele} ${m.reference || ""} ${m.numeroSerie ? "n° " + m.numeroSerie : ""}`.trim(), num(m.prixAchat).toFixed(2).replace(".", ","), m.paiementAchat, m.vendeurNom, m.vendeurAdresse, m.vendeurPiece, m.plateformeAchat, m.vendeurPseudo]),
    ]);
}

// ---------- Bonnes affaires (veille eBay) ----------

let etatVeille = null;

async function chargerVeille() {
  try {
    etatVeille = await api("veille");
  } catch (e) {
    etatVeille = { erreur: e.message, alertes: [] };
  }
  afficherAffaires();
}

function depuis(iso) {
  if (!iso) return "jamais";
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function afficherAffaires() {
  const r = donnees.reglages;
  const v = r.veille;
  const e = etatVeille;
  const ok = (b) => (b ? `<span class="positif">✓</span>` : `<span class="negatif">✗</span>`);
  const statut = !e
    ? `<p class="discret">Chargement…</p>`
    : e.erreur
      ? `<p class="erreur">${esc(e.erreur)}</p>`
      : `<div class="resultat" style="grid-template-columns:auto 1fr">
          ${ok(e.ebayConfigure)}<span>Accès eBay ${e.ebayConfigure ? "configuré" : "à configurer (secrets EBAY_CLIENT_ID et EBAY_CLIENT_SECRET)"}</span>
          ${ok(e.telegramConfigure && e.telegramRelie)}<span>Telegram ${!e.telegramConfigure ? "à configurer (secret TELEGRAM_TOKEN)" : e.telegramRelie ? "relié à ton téléphone" : "pas encore relié : envoie « bonjour » à ton bot puis clique sur « Relier Telegram »"}</span>
          ${ok(r.surveillances.some((s) => s.active !== false))}<span>${r.surveillances.filter((s) => s.active !== false).length} modèle(s) surveillé(s)</span>
          <span>🕑</span><span>Dernière recherche : ${depuis(e.dernierPassage)}${e.dernierResultat ? ` (${e.dernierResultat.nouvelles} bonne(s) affaire(s), ${e.dernierResultat.notifiees} notification(s))` : ""}</span>
          ${(e.dernierResultat?.erreurs || []).map((x) => `<span>⚠</span><span class="erreur">${esc(x)}</span>`).join("")}
        </div>`;

  const alertes = e?.alertes || [];
  $("#affaires").innerHTML = `
    <h2>Bonnes affaires</h2>
    <p class="discret">Toutes les 15 minutes, l'outil cherche sur eBay les nouvelles annonces des modèles que tu surveilles et te prévient sur Telegram quand la marge dépasse ${euros(v.margeMin)}.</p>
    <div class="carte">${statut}
      <div class="actions">
        <button id="aff-lancer">Chercher maintenant</button>
        <button class="secondaire" id="aff-telegram">Relier Telegram</button>
        <span id="aff-message" class="discret"></span>
      </div>
    </div>

    <h3>Annonces trouvées</h3>
    ${
      alertes.length
        ? `<div class="grille" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${alertes
            .map(
              (a) => `<a class="carte" href="${esc(a.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;margin:0">
                ${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px">` : ""}
                <div style="margin-top:8px"><strong>${esc(a.modele)}</strong>${a.enchere ? ` <span class="badge reparation">enchère</span>` : ""}</div>
                <div class="discret">${esc(a.titre)}</div>
                <div class="resultat" style="margin-top:8px">
                  <span>Prix</span><span>${euros(a.prix)}${a.port ? ` + ${euros(a.port)}` : ""}</span>
                  <span>Revente estimée</span><span>${euros(a.prixRevente)}</span>
                  <span class="total">Marge</span><span class="total positif">${euros(a.marge)}</span>
                </div>
                <div class="discret">${depuis(a.trouveeLe)}</div>
              </a>`
            )
            .join("")}</div>`
        : `<div class="carte"><p class="discret">Aucune bonne affaire pour l'instant. Ajoute des modèles à surveiller ci-dessous.</p></div>`
    }

    <h3>Modèles surveillés</h3>
    <p class="discret">Mots-clés : tous doivent être dans le titre de l'annonce. Prix de revente estimé : ce que tu penses revendre la montre (vérifie les ventes terminées eBay). Prix max : on ignore les annonces plus chères.</p>
    <div class="carte tableau-defile"><table>
      <thead><tr><th>Actif</th><th>Nom</th><th>Mots-clés</th><th>Mots exclus</th><th>Revente estimée (€)</th><th>Prix max (€)</th><th></th></tr></thead>
      <tbody>${r.surveillances
        .map(
          (s, i) => `<tr>
            <td><input type="checkbox" data-s="${i}" data-k="active" ${s.active !== false ? "checked" : ""} style="width:auto"></td>
            <td><input data-s="${i}" data-k="nom" value="${esc(s.nom)}"></td>
            <td><input data-s="${i}" data-k="motsCles" value="${esc(s.motsCles)}"></td>
            <td><input data-s="${i}" data-k="exclus" value="${esc(s.exclus)}" placeholder="ex. homme, quartz"></td>
            <td><input data-s="${i}" data-k="prixRevente" inputmode="decimal" value="${s.prixRevente ?? ""}"></td>
            <td><input data-s="${i}" data-k="prixMax" inputmode="decimal" value="${s.prixMax ?? ""}"></td>
            <td><button class="danger" data-suppr-s="${i}">✕</button></td>
          </tr>`
        )
        .join("")}</tbody></table>
      <div class="actions">
        <button class="secondaire" id="aff-ajout">+ Ajouter un modèle</button>
        ${r.surveillances.length ? "" : `<button id="aff-recommandes">Ajouter les ${MODELES.length} modèles recommandés</button>`}
      </div>
    </div>

    <h3>Réglages de la veille</h3>
    <div class="carte form-grille">
      <label>Marge nette minimum pour être prévenu (€) <input id="aff-marge" inputmode="decimal" value="${v.margeMin}"></label>
      <label>Plateforme où tu revends <select id="aff-plateforme">${r.plateformes
        .map((p) => `<option ${p.nom === v.plateformeRevente ? "selected" : ""}>${esc(p.nom)}</option>`)
        .join("")}</select></label>
      <label>Mots qui écartent une annonce (séparés par des virgules) <input id="aff-exclus" value="${esc(v.exclus ?? "replica, réplique, copie, fake, pour pièces, hs, ne fonctionne pas, boîte seule, boite seule, bracelet seul, lot de")}"></label>
    </div>`;

  const message = (t, classe = "discret") => {
    const el = $("#aff-message");
    el.className = classe;
    el.textContent = t;
  };
  $("#aff-lancer").onclick = async (ev) => {
    ev.target.disabled = true;
    message("Recherche en cours…");
    try {
      // On enregistre d'abord les modèles surveillés, pour que la recherche utilise la dernière version.
      clearTimeout(minuterie);
      await api("donnees", { method: "PUT", body: JSON.stringify(donnees) });
      const { resultat } = await api("veille/lancer", { method: "POST" });
      await chargerVeille();
      message(`${resultat.nouvelles} bonne(s) affaire(s) trouvée(s).`, "positif");
    } catch (err) {
      message(err.message, "erreur");
      ev.target.disabled = false;
    }
  };
  $("#aff-telegram").onclick = async () => {
    message("Connexion à Telegram…");
    try {
      await api("telegram/detecter", { method: "POST" });
      await chargerVeille();
      message("Telegram relié : tu as dû recevoir un message de confirmation.", "positif");
    } catch (err) {
      message(err.message, "erreur");
    }
  };
  const sec = $("#affaires");
  sec.querySelectorAll("[data-s]").forEach((inp) => {
    inp.onchange = () => {
      const s = r.surveillances[inp.dataset.s];
      const k = inp.dataset.k;
      s[k] = k === "active" ? inp.checked : ["prixRevente", "prixMax"].includes(k) ? num(inp.value) : inp.value.trim();
      sauvegarder();
    };
  });
  sec.querySelectorAll("[data-suppr-s]").forEach((b) => {
    b.onclick = () => {
      r.surveillances.splice(b.dataset.supprS, 1);
      sauvegarder();
      afficherAffaires();
    };
  });
  $("#aff-ajout").onclick = () => {
    r.surveillances.push({ id: crypto.randomUUID(), nom: "", motsCles: "", exclus: "", prixRevente: 0, prixMax: 0, active: true });
    sauvegarder();
    afficherAffaires();
  };
  if ($("#aff-recommandes")) {
    $("#aff-recommandes").onclick = () => {
      r.surveillances.push(...MODELES.map(surveillanceDepuisModele));
      sauvegarder();
      afficherAffaires();
    };
  }
  $("#aff-marge").onchange = (ev) => {
    v.margeMin = num(ev.target.value);
    sauvegarder();
  };
  $("#aff-plateforme").onchange = (ev) => {
    v.plateformeRevente = ev.target.value;
    sauvegarder();
  };
  $("#aff-exclus").onchange = (ev) => {
    v.exclus = ev.target.value;
    sauvegarder();
  };
}

// ---------- Modèles recherchés ----------

function afficherModeles() {
  $("#modeles").innerHTML = `
    <h2>Modèles recherchés à petit budget</h2>
    <p class="discret">Fourchettes indicatives d'occasion en bon état. Vérifie toujours les ventes terminées eBay avant d'acheter.</p>
    <div class="carte tableau-defile"><table>
      <thead><tr><th>Modèle</th><th class="nombre">Achat</th><th class="nombre">Revente</th><th>À savoir</th><th>Chercher</th></tr></thead>
      <tbody>${MODELES.map(
        (m, i) => `<tr>
          <td><strong>${esc(m.marque)}</strong> ${esc(m.modele)}</td>
          <td class="nombre">${m.achat[0]}–${m.achat[1]} €</td>
          <td class="nombre">${m.revente[0]}–${m.revente[1]} €</td>
          <td>${esc(m.conseil)}</td>
          <td><div class="liens">${Object.entries(liensRecherche(`${m.marque} ${m.ref}`))
            .map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`)
            .join("")}<button class="secondaire" data-modele="${i}" style="padding:2px 8px;font-size:0.8rem">Calculer</button>
            <button class="secondaire" data-surveiller="${i}" style="padding:2px 8px;font-size:0.8rem">Surveiller</button></div></td>
        </tr>`
      ).join("")}</tbody></table></div>
    <div class="carte"><h3>Avant chaque achat</h3><ul>
      <li>Demande une photo du dos (numéro de série, référence) et du mouvement si possible.</li>
      <li>Méfie-toi d'un prix très en dessous du marché : c'est souvent une copie.</li>
      <li>Préfère le paiement via la plateforme (protection acheteur) ou la remise en main propre.</li>
      <li>Note l'identité du vendeur pour le registre de police.</li>
    </ul></div>`;
  document.querySelectorAll("#modeles [data-modele]").forEach((b) => {
    b.onclick = () => {
      const m = MODELES[b.dataset.modele];
      changerOnglet("calcul");
      const f = $("#calc-form");
      f.querySelector("[name=achat]").value = m.achat[1];
      f.querySelector("[name=revente]").value = Math.round((m.revente[0] + m.revente[1]) / 2);
      f.dispatchEvent(new Event("input"));
    };
  });
  document.querySelectorAll("#modeles [data-surveiller]").forEach((b) => {
    b.onclick = () => {
      donnees.reglages.surveillances.push(surveillanceDepuisModele(MODELES[b.dataset.surveiller]));
      sauvegarder();
      afficherAffaires();
      b.textContent = "Surveillé ✓";
      b.disabled = true;
    };
  });
}

// ---------- Réglages ----------

function afficherReglages() {
  const r = donnees.reglages;
  $("#reglages").innerHTML = `
    <h2>Réglages</h2>
    <div class="carte">
      <h3>Frais des plateformes de vente</h3>
      <p class="discret">Vérifie les tarifs actuels de chaque plateforme pour ton statut pro : ils changent souvent.</p>
      <div class="tableau-defile"><table><thead><tr><th>Plateforme</th><th>Commission (%)</th><th>Frais fixe (€)</th><th></th></tr></thead>
      <tbody>${r.plateformes
        .map(
          (p, i) => `<tr><td><input data-i="${i}" data-k="nom" value="${esc(p.nom)}"></td>
          <td><input data-i="${i}" data-k="pct" inputmode="decimal" value="${p.pct}"></td>
          <td><input data-i="${i}" data-k="fixe" inputmode="decimal" value="${p.fixe}"></td>
          <td><button class="danger" data-suppr="${i}">✕</button></td></tr>`
        )
        .join("")}</tbody></table></div>
      <div class="actions"><button class="secondaire" id="reg-plat-ajout">+ Ajouter une plateforme</button></div>
    </div>
    <div class="carte form-grille">
      <label>Cotisations URSSAF (% du chiffre d'affaires) <input id="r-cotis" inputmode="decimal" value="${r.cotisations}"></label>
      <label>Marge nette visée par défaut (%) <input id="r-marge" inputmode="decimal" value="${r.margeCible}"></label>
    </div>
    <div class="carte">
      <h3>Sauvegarde</h3>
      <p class="discret">Tes données sont enregistrées en ligne, avec une copie par jour. Tu peux aussi garder une copie sur ton ordinateur.</p>
      <div class="actions">
        <button class="secondaire" id="r-export">Télécharger une sauvegarde</button>
        <label class="secondaire" style="display:inline-block"><input type="file" id="r-import" accept="application/json" hidden><span class="badge" style="cursor:pointer;padding:8px 14px">Restaurer une sauvegarde</span></label>
        <button class="danger" id="r-deconnexion">Se déconnecter</button>
      </div>
    </div>`;

  const sec = $("#reglages");
  sec.querySelectorAll("input[data-k]").forEach((inp) => {
    inp.onchange = () => {
      const p = r.plateformes[inp.dataset.i];
      p[inp.dataset.k] = inp.dataset.k === "nom" ? inp.value.trim() : num(inp.value);
      sauvegarder();
      afficherCalcul();
    };
  });
  sec.querySelectorAll("[data-suppr]").forEach((b) => {
    b.onclick = () => {
      r.plateformes.splice(b.dataset.suppr, 1);
      sauvegarder();
      afficherTout();
    };
  });
  $("#reg-plat-ajout").onclick = () => {
    r.plateformes.push({ nom: "Nouvelle", pct: 0, fixe: 0 });
    sauvegarder();
    afficherReglages();
  };
  $("#r-cotis").onchange = (e) => {
    r.cotisations = num(e.target.value);
    sauvegarder();
    afficherTout();
  };
  $("#r-marge").onchange = (e) => {
    r.margeCible = num(e.target.value);
    sauvegarder();
    afficherCalcul();
  };
  $("#r-export").onclick = () => {
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }));
    lien.download = `sauvegarde-montres-${aujourdhui()}.json`;
    lien.click();
  };
  $("#r-import").onchange = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    try {
      const d = JSON.parse(await fichier.text());
      if (!Array.isArray(d.montres) || typeof d.reglages !== "object") throw new Error();
      if (!confirm(`Remplacer tes données actuelles par cette sauvegarde (${d.montres.length} montres) ?`)) return;
      donnees = d;
      sauvegarder();
      afficherTout();
    } catch {
      alert("Ce fichier n'est pas une sauvegarde valide.");
    }
  };
  $("#r-deconnexion").onclick = () => {
    memoriser("montres-mdp", null);
    location.reload();
  };
}

// ---------- Démarrage ----------

document.querySelectorAll("#onglets button").forEach((b) => (b.onclick = () => changerOnglet(b.dataset.onglet)));
document.addEventListener("click", (e) => {
  const cible = e.target.closest("[data-aller]");
  if (cible) changerOnglet(cible.dataset.aller);
});

$("#form-login").onsubmit = async (e) => {
  e.preventDefault();
  const erreur = $("#login-erreur");
  erreur.hidden = true;
  try {
    await connexion($("#mdp").value);
  } catch (err) {
    erreur.textContent = err.message;
    erreur.hidden = false;
  }
};

(async () => {
  const enregistre = relire("montres-mdp");
  if (enregistre) {
    try {
      await connexion(enregistre);
      changerOnglet(relire("montres-onglet") || "affaires");
      return;
    } catch {}
  }
  $("#ecran-login").hidden = false;
})();
