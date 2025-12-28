# Engine Changelog

Historique des versions du moteur de simulation AssurManager.

---

## [1.0.0] - 2025-01-15 — MVP Release

### 🎮 Initial Release

Premier lancement du moteur de simulation pour le MVP.

### Features

- **7 Indices systémiques**
  - IAC (Indice Attractivité Commerciale)
  - IPQO (Indice Performance & Qualité Opérationnelle)
  - IERH (Indice Équilibre RH)
  - IRF (Indice Résilience Financière)
  - IMD (Indice Maturité Data)
  - IS (Indice de Sincérité)
  - IPP (Indice Performance P&L)

- **2 Produits**
  - Auto
  - MRH (Multi-Risques Habitation)

- **Système d'effets retard**
  - RH : 2 tours
  - IT/Data : 3-6 tours
  - Prévention : 4-8 tours
  - Marketing : 1-2 tours

- **Difficultés**
  - Novice (~12 leviers)
  - Intermédiaire (~22 leviers)

- **Mode de jeu**
  - Solo (joueur vs 17 IA)

### Technical

- Append-only game state storage
- SHA256 checksum validation
- Reproducible randomness (seed-based)

---

## Versioning Convention

```
MAJOR.MINOR.PATCH

MAJOR — Changements breaking (formules, indices)
        Les scores ne sont pas comparables entre versions MAJOR différentes.
        
MINOR — Nouvelles fonctionnalités rétrocompatibles
        Nouveaux leviers, événements, paramètres.
        
PATCH — Corrections de bugs
        Ajustements d'équilibrage mineurs.
```

### Invariants

- `INV-ENGINE-01` : Recalcul rétroactif interdit
- `INV-ENGINE-05` : Même (seed, décisions, engine_version) → Même résultat
