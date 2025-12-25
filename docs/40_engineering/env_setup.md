# Setup Environnement — AssurManager

> **Source of Truth** pour l'installation et la configuration de l'environnement de développement.
> Dernière mise à jour : 2025-12-25

---

## 1) Prérequis

### Logiciels à installer

| Outil | Version minimum | Vérification | Installation |
|-------|-----------------|--------------|--------------|
| **Node.js** | 18.17+ (LTS 20 recommandé) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ (inclus avec Node.js) | `npm --version` | Inclus |
| **Git** | 2.40+ | `git --version` | [git-scm.com](https://git-scm.com/) |
| **VS Code** | Dernière | — | [code.visualstudio.com](https://code.visualstudio.com/) |

### Extensions VS Code recommandées

```
ext install dbaeumer.vscode-eslint
ext install bradlc.vscode-tailwindcss
ext install esbenp.prettier-vscode
```

Ou via `.vscode/extensions.json` (à créer si besoin) :

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "supabase.supabase-extension"
  ]
}
```

---

## 2) Installation initiale

### Étape 1 : Cloner le repository

```bash
git clone https://github.com/Maclance/Code_SGA.git
cd Code_SGA
```

### Étape 2 : Installer les dépendances

```bash
npm install
```

> **Durée estimée** : 1-2 minutes (selon connexion)

### Étape 3 : Configurer les variables d'environnement

```bash
# Copier le template
cp .env.local.example .env.local

# Éditer avec vos valeurs Supabase
code .env.local
```

Contenu à remplir :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Pour les fonctions serveur (optionnel MVP)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Où trouver ces valeurs ?**  
> Supabase Dashboard → Project Settings → API

### Étape 4 : Vérifier l'installation

```bash
# Vérifier les types
npm run type-check

# Lancer le serveur de développement
npm run dev
```

Si tout va bien : ouvrir http://localhost:3000

---

## 3) Configuration Supabase

### Projet Supabase

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet (région : EU West pour RGPD)
3. Récupérer les clés API (§2 Étape 3)

### Migrations SQL locales

Les migrations sont versionnées dans `supabase/migrations/`.

**Structure** :
```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_sessions.sql
│   └── ...
└── seed.sql
```

**Appliquer une migration manuellement** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier/coller le contenu du fichier `.sql`
3. Exécuter

> **Note** : Supabase CLI (`supabase` command) peut automatiser ceci, mais n'est pas requis MVP.

### Vérifier la connexion

Créer un fichier de test temporaire :

```typescript
// src/app/api/healthcheck/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('_test').select('1');
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = table not found (OK si pas de table _test)
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
  
  return Response.json({ status: 'ok' });
}
```

Tester : http://localhost:3000/api/healthcheck

---

## 4) Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (hot reload) |
| `npm run build` | Build de production |
| `npm run start` | Serveur production (après build) |
| `npm run lint` | Linter ESLint |
| `npm run type-check` | Vérification TypeScript |

### Scripts à ajouter (recommandé)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 5) Structure des fichiers de config

| Fichier | Rôle |
|---------|------|
| `.env.local` | Variables d'environnement (secrets, local) |
| `.env.local.example` | Template sans secrets (versionné) |
| `next.config.ts` | Configuration Next.js |
| `tsconfig.json` | Configuration TypeScript |
| `.gitignore` | Fichiers à ignorer par Git |
| `package.json` | Dépendances et scripts |

---

## 6) Troubleshooting

### Erreur : "Module not found"

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install
```

### Erreur : "Cannot find module '@/...'"

Vérifier que `tsconfig.json` contient :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erreur Supabase : "Invalid API key"

1. Vérifier `.env.local` existe
2. Vérifier les valeurs copiées (pas d'espaces)
3. Redémarrer `npm run dev`

### Erreur : "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou utiliser un autre port
npm run dev -- -p 3001
```

### Erreur : "EPERM: operation not permitted"

Windows + OneDrive peut causer des conflits. Solutions :
1. Fermer VS Code et autres éditeurs
2. Attendre la sync OneDrive
3. Réessayer

### TypeScript : erreurs dans les types Supabase

Régénérer les types (si Supabase CLI installé) :

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

---

## 7) Configuration VS Code recommandée

Créer `.vscode/settings.json` :

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 8) Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Secrets committés** | Fuite données | Moyenne | `.env.local` dans `.gitignore`, revue avant push |
| **Node version incompatible** | Build fail | Faible | Documenter version, utiliser `.nvmrc` si besoin |
| **OneDrive sync conflicts** | Fichiers corrompus | Moyenne | Travailler hors sync ou pause OneDrive |
| **Supabase projet supprimé** | Perte données | Faible | Backup régulier, seed.sql pour dev |
| **npm cache corrompu** | Install fail | Faible | `npm cache clean --force` |

---

## 9) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| ENV-001 | npm (pas pnpm/yarn) | 2025-12 | Simplicité, déjà en place |
| ENV-002 | Migrations SQL manuelles MVP | 2025-12 | Pas de Supabase CLI requis |
| ENV-003 | VS Code recommandé | 2025-12 | Extensions ESLint/TS intégrées |
| ENV-004 | Node 20 LTS cible | 2025-12 | Support long terme |

---

## 10) Checklist premier setup

- [ ] Node.js 18+ installé
- [ ] Repo cloné
- [ ] `npm install` réussi
- [ ] `.env.local` configuré
- [ ] `npm run type-check` passe
- [ ] `npm run dev` fonctionne
- [ ] http://localhost:3000 affiche la page
- [ ] Extensions VS Code installées
