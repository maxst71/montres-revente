const etat = document.getElementById("etat");

chrome.storage.local.get(["adresse", "motDePasse", "apprendre"]).then(({ adresse, motDePasse, apprendre }) => {
  document.getElementById("apprendre").checked = apprendre !== false;
  document.getElementById("adresse").value = adresse || "";
  document.getElementById("mdp").value = motDePasse || "";
});

document.getElementById("enregistrer").onclick = async () => {
  const adresse = document.getElementById("adresse").value.trim().replace(/\/+$/, "");
  const motDePasse = document.getElementById("mdp").value;
  await chrome.storage.local.set({ adresse, motDePasse, apprendre: document.getElementById("apprendre").checked });
  etat.className = "";
  etat.textContent = "Test en cours…";
  const reponse = await chrome.runtime.sendMessage({ type: "reglages", forcer: true });
  if (reponse.erreur) {
    etat.className = "ko";
    etat.textContent = "✗ " + reponse.erreur;
  } else {
    const n = (reponse.reglages.surveillances || []).filter((s) => s.active !== false).length;
    etat.className = "ok";
    etat.textContent = `✓ Connecté : ${n} modèle(s) surveillé(s). Ouvre une annonce Vinted, Leboncoin ou eBay.`;
  }
};

document.getElementById("apprendre").onchange = (ev) => chrome.storage.local.set({ apprendre: ev.target.checked });
