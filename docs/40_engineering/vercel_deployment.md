# Guide de déploiement Vercel — AssurManager

> **Documentation complète** pour configurer et déployer l'application sur Vercel  
> Dernière mise à jour : 2025-12-29

---

## 1) Vue d'ensemble

Ce guide couvre la configuration du déploiement automatique via Vercel pour le projet AssurManager. Vercel déploie automatiquement :
- **Production** : branche `main`
- **Preview** : branche `develop` et toutes les pull requests

**Prérequis :**
- Compte Vercel (gratuit suffisant pour MVP)
- Repository GitHub `Maclance/Code_SGA` accessible
- Variables d'environnement Supabase disponibles

---

## 2) Configuration initiale du projet Vercel

### Étape 1 : Importer le projet depuis GitHub

1. Se connecter sur [vercel.com](https://vercel.com)
2. Cliquer sur **"Add New Project"**
3. Sélectionner **"Import Git Repository"**
4. Choisir le repository `Maclance/Code_SGA`

### Étape 2 : Configurer les paramètres du projet

Sur la page de configuration :

| Paramètre | Valeur | Notes |
|-----------|--------|-------|
| **Project Name** | `code-sga` | Ou nom de votre choix |
| **Framework Preset** | Next.js | Détecté automatiquement ✅ |
| **Root Directory** | `./` | Racine du projet |
| **Build Command** | `npm run build` | Par défaut |
| **Output Directory** | `.next` | Par défaut Next.js |
| **Install Command** | `npm install` | Par défaut |

> [!NOTE]
> Le fichier `vercel.json` à la racine du projet définit déjà ces paramètres. Vercel les utilisera automatiquement.

### Étape 3 : Configurer les variables d'environnement

**IMPORTANT :** Avant de déployer, configurer les variables d'environnement.

1. Dans la page de configuration, cliquer sur **"Environment Variables"**
2. Ajouter les 3 variables suivantes :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Votre URL Supabase (ex: `https://xxx.supabase.co`) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre clé anon Supabase | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre clé service_role Supabase ⚠️ | Production, Preview, Development |

**Où trouver ces valeurs ?**
- Supabase Dashboard → Settings → API
- Ou copier depuis votre fichier `.env.local` local

> [!WARNING]
> **NE JAMAIS** committer le fichier `.env.local` dans Git. Les secrets doivent uniquement être dans Vercel et votre fichier local.

### Étape 4 : Déployer

1. Cliquer sur **"Deploy"**
2. Attendre le build (1-3 minutes généralement)
3. Une fois terminé, noter l'URL de production : `https://code-sga.vercel.app` (ou similaire)

---

## 3) Vérification du déploiement

### Test du healthcheck

Une fois le déploiement réussi :

```bash
# Remplacer par votre URL Vercel
curl https://code-sga.vercel.app/api/health
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T18:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "ok",
      "latency_ms": 120,
      "result": 1
    },
    "auth": {
      "status": "ok"
    }
  }
}
```

✅ **Statut HTTP 200** = Tout fonctionne !  
❌ **Statut HTTP 503** = Problème de connexion (vérifier les variables d'environnement)

### Accès au dashboard

Vérifier dans le dashboard Vercel :
- ✅ Build succeeded (icône verte)
- ✅ Production deployment actif
- ✅ URL accessible

---

## 4) Configuration des branches

### Production (main)

Tous les commits sur `main` déclenchent un déploiement en production automatiquement.

```bash
git checkout main
git merge develop
git push origin main
# → Déploiement automatique vers https://code-sga.vercel.app
```

### Preview (develop)

Tous les commits sur `develop` créent un déploiement de preview avec une URL unique.

```bash
git checkout develop
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop
# → Preview URL : https://code-sga-git-develop-maclance.vercel.app
```

### Pull Requests

Chaque PR crée automatiquement un déploiement de preview unique.

---

## 5) Gestion des variables d'environnement

### Ajouter une nouvelle variable

1. Dashboard Vercel → Projet `code-sga`
2. **Settings** → **Environment Variables**
3. Cliquer **"Add New"**
4. Renseigner :
   - **Key** : Nom de la variable (ex: `NEW_API_KEY`)
   - **Value** : Valeur secrète
   - **Environments** : Sélectionner Production/Preview/Development
5. Cliquer **"Save"**

> [!IMPORTANT]
> Après modification des variables d'environnement, il faut **redéployer** pour qu'elles soient prises en compte :
> - Dashboard → Deployments → Latest → Menu (…) → Redeploy

### Mettre à jour .env.local.example

Quand vous ajoutez une nouvelle variable, **ne pas oublier** de mettre à jour le template :

```bash
# Éditer .env.local.example
echo "NEW_API_KEY=your-key-here" >> .env.local.example
git add .env.local.example
git commit -m "docs: update env template with NEW_API_KEY"
```

---

## 6) Logs et monitoring

### Consulter les logs

1. Dashboard Vercel → Projet `code-sga`
2. **Deployments** → Sélectionner un déploiement
3. **View Function Logs**

Les logs affichent :
- Requêtes API
- Erreurs serveur
- Performance des fonctions

### Monitoring

Vercel fournit automatiquement :
- **Analytics** : Trafic, performance
- **Speed Insights** : Core Web Vitals
- **Error tracking** : Erreurs côté client/serveur

Accès via : Dashboard → Projet → Onglet **Analytics**

---

## 7) Troubleshooting

### Erreur : "Build failed"

**Cause probable :** Erreur de compilation TypeScript ou Next.js

**Solution :**
```bash
# Tester le build localement
npm run build

# Si erreurs TypeScript
npm run type-check

# Corriger les erreurs puis re-pusher
```

### Erreur : "Database connection failed" (503)

**Cause probable :** Variables d'environnement Supabase manquantes ou incorrectes

**Solution :**
1. Vérifier Settings → Environment Variables dans Vercel
2. S'assurer que les 3 variables sont présentes et correctes
3. Redéployer après correction

### Erreur : "Function invocation timeout"

**Cause probable :** Requête Supabase trop longue (limite 10s sur free tier)

**Solution :**
- Optimiser les requêtes SQL
- Ajouter des index sur les tables
- Considérer l'upgrade vers Vercel Pro si nécessaire

### Preview deployments non créés

**Cause probable :** Intégration GitHub non configurée correctement

**Solution :**
1. Dashboard Vercel → Settings → Git
2. Vérifier que le repository est bien lié
3. Vérifier les permissions GitHub de l'app Vercel

---

## 8) Sécurité

### Headers de sécurité

Le fichier `vercel.json` configure automatiquement :

| Header | Valeur | Protection |
|--------|--------|------------|
| `X-Content-Type-Options` | `nosniff` | Empêche le MIME sniffing |
| `X-Frame-Options` | `DENY` | Prévient le clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Protection XSS navigateur |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Contrôle du referrer |
| `Permissions-Policy` | `camera=(), microphone=()` | Désactive APIs non utilisées |

### Cache API

Les endpoints `/api/*` ont un header `Cache-Control: no-store` pour éviter le cache de données sensibles.

### Secrets

- ✅ **JAMAIS** de secrets dans le code source
- ✅ Variables d'environnement uniquement via Vercel Dashboard
- ✅ `.env.local` dans `.gitignore`

---

## 9) Commandes utiles

| Action | Commande |
|--------|----------|
| Déployer manuellement | `npx vercel` (depuis la racine du projet) |
| Déployer en production | `npx vercel --prod` |
| Voir les logs en temps réel | `npx vercel logs` |
| Lister les déploiements | `npx vercel ls` |
| Pull env variables localement | `npx vercel env pull .env.local` |

> Nécessite l'installation de Vercel CLI : `npm i -g vercel`

---

## 10) Checklist post-déploiement

- [ ] ✅ Premier déploiement réussi (statut vert)
- [ ] ✅ `/api/health` retourne 200
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ URL de production notée et testée
- [ ] ✅ Preview deployments fonctionnent sur `develop`
- [ ] ✅ Logs accessibles et pas d'erreurs
- [ ] ✅ Analytics activées

---

## 11) Ressources

- [Documentation Vercel Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/hosting/vercel)

---

> **Document vivant** — Mettre à jour ce guide si la configuration Vercel change.
