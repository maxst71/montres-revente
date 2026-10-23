// Récupère les réglages de l'outil (modèles surveillés, frais) avec le mot de passe enregistré.
// Passer par ici évite les blocages du navigateur entre le site de l'annonce et celui de l'outil.
let cache = null;
let cacheLe = 0;

async function reglagesOutil(forcer = false) {
  if (!forcer && cache && Date.now() - cacheLe < 5 * 60 * 1000) return cache;
  const { adresse, motDePasse } = await chrome.storage.local.get(["adresse", "motDePasse"]);
  if (!adresse || !motDePasse) throw new Error("Configure l'extension : clique sur son icône et renseigne l'adresse de l'outil et ton mot de passe.");
  const r = await fetch(`${adresse.replace(/\/+$/, "")}/api/donnees`, { headers: { "x-password": motDePasse } });
  if (r.status === 401) throw new Error("Mot de passe refusé par l'outil.");
  if (!r.ok) throw new Error(`L'outil ne répond pas (${r.status}).`);
  const { data } = await r.json();
  cache = data?.reglages || {};
  cacheLe = Date.now();
  return cache;
}

chrome.runtime.onMessage.addListener((message, _expediteur, repondre) => {
  if (message.type !== "reglages") return false;
  reglagesOutil(message.forcer)
    .then((reglages) => repondre({ reglages }))
    .catch((e) => repondre({ erreur: e.message }));
  return true;
});
