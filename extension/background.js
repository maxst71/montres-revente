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

async function envoyer(chemin, corps) {
  const { adresse, motDePasse } = await chrome.storage.local.get(["adresse", "motDePasse"]);
  const r = await fetch(`${adresse.replace(/\/+$/, "")}/api/${chemin}`, {
    method: "POST",
    headers: { "x-password": motDePasse, "content-type": "application/json" },
    body: JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`Enregistrement impossible (${r.status}).`);
  return r.json();
}

chrome.runtime.onMessage.addListener((message, _expediteur, repondre) => {
  const actions = {
    reglages: () => reglagesOutil(message.forcer).then((reglages) => ({ reglages })),
    // Enregistre l'annonce consultée dans la base de l'outil et renvoie les prix observés du modèle.
    consultation: () => envoyer("consultations", message.fiche),
    surveiller: () => envoyer("surveillances", message.surveillance).then((r) => ((cache = null), r)),
  };
  if (!actions[message.type]) return false;
  actions[message.type]()
    .then(repondre)
    .catch((e) => repondre({ erreur: e.message }));
  return true;
});
