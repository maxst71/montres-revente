# iTech Montres

Outil personnel de gestion d'achat-revente de montres. Fonctionne sur Cloudflare Pages ou sur Netlify.

- **Bonnes affaires** : toutes les 15 minutes, cherche sur eBay les nouvelles annonces des modèles surveillés et prévient sur Telegram quand la marge est bonne.
- **Extension Chrome** (dossier `extension/`) : sur une annonce Vinted, Leboncoin ou eBay, affiche le modèle reconnu, la revente estimée et la marge.
- **Tableau de bord** : bénéfice du mois, stock, argent immobilisé, délai de revente.
- **Calculateur** : est-ce que cette montre vaut le coup, et à quel prix maximum l'acheter.
- **Stock** : chaque montre de l'achat à la vente, export CSV.
- **Registre de police** : rempli automatiquement, imprimable en PDF et exportable.
- **Modèles** : montres recherchées à petit budget, avec liens vers les ventes terminées eBay, Vinted, Leboncoin et Chrono24.
- **Réglages** : frais des plateformes, cotisations URSSAF, sauvegarde.

Les données sont stockées chez l'hébergeur (Cloudflare KV ou Netlify Blobs), avec une copie automatique par jour.

## Mise en ligne sur Cloudflare Workers (gratuit, utilisé actuellement)

`wrangler.jsonc` et `worker.js` décrivent tout : appli dans `public/`, API dans `/api/*`, stockage KV `montres`.
Le Worker « montres-revente » est relié à ce dépôt GitHub et se redéploie à chaque modification.
Le mot de passe se règle dans **Paramètres > Variables et secrets** du Worker : `APP_PASSWORD`, type **Secret**.

### Veille eBay et Telegram

1. **eBay** : crée un compte gratuit sur developer.ebay.com, puis **Application Keysets** > clés **Production**.
   Pour activer les clés, eBay demande comment tu gères la suppression des comptes : choisis l'exemption.
   Ajoute dans le Worker les secrets `EBAY_CLIENT_ID` (App ID) et `EBAY_CLIENT_SECRET` (Cert ID).
2. **Telegram** : écris à @BotFather, commande `/newbot`, puis ajoute le jeton reçu en secret `TELEGRAM_TOKEN`.
   Envoie « bonjour » à ton bot, puis clique sur **Relier Telegram** dans l'onglet Bonnes affaires.

### Extension Chrome

`chrome://extensions` > **Mode développeur** > **Charger l'extension non empaquetée** > dossier `extension`.
Clique sur l'icône de l'extension et renseigne l'adresse de l'outil et ton mot de passe.
`extension/analyse.mjs` est une copie de `lib/analyse.mjs` : garder les deux identiques.

## Mise en ligne sur Cloudflare Pages (alternative)

1. Dans Cloudflare, **Storage & Databases > KV** : crée un espace de noms `montres`.
2. **Workers & Pages > Create > Pages > Connect to Git** : choisis ce dépôt GitHub.
   - Framework preset : None. Build command : vide. Build output directory : `public`.
3. Dans le projet, **Settings > Variables and Secrets** : ajoute `APP_PASSWORD` (type Secret).
4. **Settings > Bindings > Add > KV namespace** : nom de variable `MONTRES`, espace de noms `montres`.
5. **Deployments** : relance le dernier déploiement pour prendre en compte les réglages.
6. **Custom domains** : ajoute itechstation.fr et suis les indications DNS (chez Ionos).

## Mise en ligne sur Netlify

1. Sur Netlify, ouvre le site relié à itechstation.fr, puis **Site configuration > Build & deploy > Link repository** et choisis ce dépôt GitHub.
   - Commande de build : laisser vide. Dossier publié : `public` (déjà défini dans `netlify.toml`).
2. Dans **Site configuration > Environment variables**, ajoute `APP_PASSWORD` avec un mot de passe solide.
3. Lance un déploiement (**Deploys > Trigger deploy**).
4. Ouvre https://itechstation.fr et connecte-toi avec ce mot de passe.

## Tester sur un ordinateur

```
npm install
APP_PASSWORD=test npm run dev
```

Puis ouvre http://localhost:8888 (mot de passe `test`). Les données de test sont perdues à l'arrêt.
