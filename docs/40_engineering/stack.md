# Stack Technique — AssurManager

> **Source of Truth** pour les choix technologiques du projet.
> Dernière mise à jour : 2025-12-25

---

## 1) Philosophie

> **Simplicité > Sophistication**

En tant que solo dev, chaque dépendance ajoutée est une dette de maintenance. Les choix ci-dessous privilégient :
- La **productivité** (DX, hot reload, typage)
- La **maintenabilité** (moins de dépendances = moins de breaking changes)
- La **scalabilité future** (architecture extensible sans refonte)

---

## 2) Stack Core

| Couche | Technologie | Version | Justification |
|--------|-------------|---------|---------------|
| **Framework** | Next.js | 15.x | App Router, SSR/SSG, API Routes, excellent DX |
| **UI** | React | 19.x | Standard industrie, large écosystème |
| **Langage** | TypeScript | 5.x | Typage fort, refactoring sûr, autocomplétion |
| **Backend** | Supabase | 2.x | Auth + DB + Storage + Realtime en 1 service |
| **Linting** | ESLint | 9.x | Qualité code, intégré Next.js |
| **Tests** | Vitest | (à ajouter) | Rapide, compatible ESM, API Jest-like |

---

## 3) Pourquoi Next.js + Supabase ?

### Next.js 15 (App Router)

| Besoin | Solution Next.js |
|--------|------------------|
| SEO dashboard public | SSG/SSR natif |
| API interne | Route Handlers (`app/api/`) |
| Auth côté serveur | Server Components + cookies |
| Temps réel (V1) | Compatible WebSocket via Supabase Realtime |
| Déploiement simple | Vercel (zéro config) |

**Alternative sans Next.js** : Vite + React + serveur Express séparé → plus de code, plus de maintenance.

### Supabase

| Besoin | Solution Supabase |
|--------|-------------------|
| Auth multi-tenant | Supabase Auth + RLS (Row Level Security) |
| Base de données | PostgreSQL managé |
| Stockage fichiers | Supabase Storage (PDF exports) |
| Temps réel (V1) | Realtime channels |
| Migrations | Fichiers SQL versionnés |

**Alternative sans Supabase** : Firebase (NoSQL, moins adapté aux jointures) ou PostgreSQL auto-hébergé (plus de DevOps).

---

## 4) Dépendances actuelles

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0"
  }
}
```

### Tableau de justification

| Dépendance | Justification | Alternative native |
|------------|---------------|-------------------|
| `next` | Framework coeur | Vite (moins intégré SSR) |
| `react`, `react-dom` | UI coeur | Preact (moins d'écosystème) |
| `@supabase/supabase-js` | Client DB/Auth | Fetch manuel (plus verbeux) |
| `@supabase/ssr` | Auth SSR Next.js | Gestion cookies manuelle |
| `typescript` | Typage | JavaScript (moins sûr) |
| `eslint` | Qualité code | Revue manuelle (non scalable) |

---

## 5) Dépendances à ajouter (MVP)

| Dépendance | Usage | Priorité | Voir [`dependencies_policy.md`](./dependencies_policy.md) |
|------------|-------|----------|-----------------------------------------------------------|
| `vitest` | Tests unitaires moteur | P0 | Justifié : moteur = cœur métier |
| *(aucune autre pour MVP)* | — | — | — |

---

## 6) Dépendances explicitement évitées

| Catégorie | Exemples | Raison |
|-----------|----------|--------|
| UI Framework lourd | MUI, Chakra, Ant Design | Bundle size, personnalisation limitée |
| State management externe | Redux, Zustand | React Context + Server Components suffisent |
| ORM | Prisma, Drizzle | Supabase client + SQL natif suffisent |
| CSS-in-JS | Styled-components, Emotion | CSS Modules natifs Next.js suffisent |
| Form library | React Hook Form, Formik | Formulaires simples, gestion manuelle OK |

> **Exception future** : si complexité formulaires MVP explose, `react-hook-form` pourra être ajouté.

---

## 7) Architecture cible (diagramme)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Next.js 15 (App Router)                                 ││
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     ││
│  │ │ Server       │ │ Client       │ │ Route        │     ││
│  │ │ Components   │ │ Components   │ │ Handlers     │     ││
│  │ │ (cockpit,    │ │ (interactif, │ │ (API interne)│     ││
│  │ │  dashboard)  │ │  décisions)  │ │              │     ││
│  │ └──────────────┘ └──────────────┘ └──────────────┘     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Supabase                                                ││
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     ││
│  │ │ Auth         │ │ PostgreSQL   │ │ Storage      │     ││
│  │ │ (RBAC, RLS)  │ │ (données)    │ │ (PDF export) │     ││
│  │ └──────────────┘ └──────────────┘ └──────────────┘     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT                             │
│  Vercel (Preview + Production) + GitHub Actions (CI)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 8) Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Breaking change Next.js 15** | Refactor pages | Moyenne | Suivre les release notes, tester sur staging |
| **Supabase indisponible** | App down | Faible | Monitoring Supabase Status, fallback read-only |
| **Supabase pricing scalabilité** | Coûts V1+ | Moyenne | Estimer usage séminaire 200+, prévoir budget |
| **React 19 instabilité** | Bugs UI | Faible | Version stable utilisée, pas de features expérimentales |
| **Vitest breaking change** | Tests cassés | Faible | Lock version, tester avant upgrade |

---

## 9) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| STACK-001 | Next.js 15 App Router | 2025-12 | Meilleur DX SSR/SSG, Vercel natif |
| STACK-002 | Supabase comme BaaS unique | 2025-12 | Auth + DB + Storage intégrés |
| STACK-003 | Vitest pour tests | 2025-12 | Plus rapide que Jest, ESM natif |
| STACK-004 | Pas d'UI framework | 2025-12 | CSS Modules + composants custom |
| STACK-005 | npm comme package manager | 2025-12 | Standard, déjà en place |

---

## 10) Checklist de validation stack

- [ ] `npm run build` passe sans erreur
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run type-check` passe sans erreur
- [ ] Connexion Supabase fonctionnelle (healthcheck)
- [ ] Déploiement Vercel preview OK
