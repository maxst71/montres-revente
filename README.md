# iTech Montres

Outil personnel de gestion d'achat-revente de montres. Fonctionne sur Cloudflare Pages ou sur Netlify.

- **Tableau de bord** : bénéfice du mois, stock, argent immobilisé, délai de revente.
- **Calculateur** : est-ce que cette montre vaut le coup, et à quel prix maximum l'acheter.
- **Stock** : chaque montre de l'achat à la vente, export CSV.
- **Registre de police** : rempli automatiquement, imprimable en PDF et exportable.
- **Modèles** : montres recherchées à petit budget, avec liens vers les ventes terminées eBay, Vinted, Leboncoin et Chrono24.
- **Réglages** : frais des plateformes, cotisations URSSAF, sauvegarde.

Les données sont stockées chez l'hébergeur (Cloudflare KV ou Netlify Blobs), avec une copie automatique par jour.

## Mise en ligne sur Cloudflare Pages (gratuit)

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
