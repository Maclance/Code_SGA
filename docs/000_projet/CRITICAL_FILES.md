# Fichiers Critiques — NE PAS SUPPRIMER

> ⚠️ **ATTENTION** : Les fichiers listés ci-dessous sont essentiels au fonctionnement de l'application.
> Leur suppression causera des erreurs en production.

---

## Routes API

Ces fichiers `route.ts` gèrent les endpoints de l'API. Sans eux, les appels frontend échoueront.

| Fichier | Fonction | User Story |
|---------|----------|------------|
| `src/app/api/sessions/route.ts` | Liste et création de sessions | US-010 |
| `src/app/api/sessions/[sessionId]/route.ts` | Détail et mise à jour session | US-010 |
| `src/app/api/sessions/[sessionId]/confirm-scope/route.ts` | Confirmation produits, démarrage partie | US-013 |
| `src/app/api/sessions/join/route.ts` | Rejoindre une session par code | US-012 |
| `src/app/api/game/[sessionId]/turns/[turnNumber]/resolve/route.ts` | Chargement et résolution de tour | US-014 |
| `src/app/api/health/route.ts` | Health check pour monitoring | — |

---

## Moteur de Simulation

Le cœur du calcul de la simulation. Ces fichiers contiennent les formules métier.

| Fichier | Fonction |
|---------|----------|
| `src/lib/engine/index.ts` | Exports centralisés du moteur |
| `src/lib/engine/version.ts` | Version du moteur (ENGINE_VERSION) |
| `src/lib/engine/indices.ts` | Calcul des 7 indices stratégiques |
| `src/lib/engine/pnl.ts` | Calcul du P&L |
| `src/lib/engine/delayed-effects.ts` | Gestion des effets retard |
| `src/lib/engine/effect-stacking.ts` | Agrégation et caps des effets |

### Module Marché (US-036)

| Fichier | Fonction |
|---------|----------|
| `src/lib/engine/market/market-types.ts` | Types et constantes marché |
| `src/lib/engine/market/market-calculator.ts` | Calcul parts de marché et tendances prix |

### Module Explicabilité (US-037)

| Fichier | Fonction |
|---------|----------|
| `src/lib/engine/explainability/driver-types.ts` | Types pour l'analyse des drivers |
| `src/lib/engine/explainability/driver-analyzer.ts` | Analyse causale des variations d'indices |
| `src/lib/engine/explainability/driver-formatter.ts` | Formatage des drivers pour l'affichage |

---

## Services

Logique métier et accès base de données.

| Fichier | Fonction |
|---------|----------|
| `src/lib/services/session.service.ts` | CRUD sessions, join, confirm scope |
| `src/lib/services/game-state.service.ts` | Sauvegarde/chargement états de tour |
| `src/lib/services/audit.service.ts` | Logging des actions utilisateur |

---

## Vérification Automatique

Ces fichiers sont vérifiés automatiquement par :
- **Script** : `npm run check-routes`
- **Test** : `tests/critical-routes.test.ts`
- **CI** : GitHub Actions avant chaque merge

---

## Comment Ajouter un Fichier Critique

1. Ajouter le chemin dans `scripts/critical-routes.ts`
2. Mettre à jour ce document
3. Commit avec message : `docs: add [file] to critical files registry`
