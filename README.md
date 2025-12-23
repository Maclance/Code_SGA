# AssurManager : Le Défi IARD

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com/)

**Plateforme SaaS B2B de serious game** qui place l'apprenant à la tête d'une compagnie d'assurance IARD dans un marché français concurrentiel.

## 🎮 Concept

Le jeu combine :
- **Civ-like** : Choix parmi 18 compagnies, progression sur plusieurs tours, dynamiques concurrentielles
- **Tower Defense** : Vagues de menaces externes (climat, inflation, réglementation, cyber) à contrer via des défenses stratégiques

## 🎯 Objectifs Pédagogiques

Former les équipes métiers (Direction, Actuariat, Indemnisation, Distribution, Finance, Data/IT) à :
- Arbitrer croissance vs rentabilité par produit et au niveau compagnie
- Gérer la chaîne sinistres et ses effets sur la satisfaction
- Anticiper les impacts RH/IT/Data avec leurs effets retard
- Intégrer la conformité comme contrainte structurante

## 🏗️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15 + React 19 |
| Langage | TypeScript |
| Backend/BDD | Supabase (PostgreSQL + Auth) |
| Styling | CSS Modules / Tailwind |
| Déploiement | Vercel |

## 📁 Structure du Projet

```
├── docs/               # Documentation (PRD, Backlog)
├── src/
│   ├── app/           # Pages Next.js (App Router)
│   ├── components/    # Composants React
│   ├── contexts/      # Contextes React
│   ├── engine/        # Moteur de simulation
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilitaires & Supabase client
│   ├── types/         # Types TypeScript
│   └── data/          # Données statiques (compagnies, événements)
├── public/            # Assets statiques
└── supabase/          # Migrations & config Supabase
```

## 🚀 Démarrage

```bash
# Installation des dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
```

## 📋 MVP Features

- ✅ Mode Solo (joueur vs IA)
- ✅ 18 compagnies jouables avec traits uniques
- ✅ 2 produits : Auto + MRH
- ✅ 7 indices systémiques (IAC, IPQO, IERH, IRF, IMD, IS, IPP)
- ✅ Dashboard cockpit avec indicateurs par produit
- ✅ Événements marché & compagnie
- ✅ Effets retard sur décisions RH/IT/Prévention
- ✅ Debrief fin de partie + Export PDF

## 📄 Documentation

- [PRD complet](docs/prd.md)
- [Backlog MVP](docs/backlog.md)

## 📜 Licence

Propriétaire - Tous droits réservés
