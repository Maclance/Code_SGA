# Stratégie de Tests — AssurManager

> **Source of Truth** pour la stratégie, les outils et les priorités de tests.
> Dernière mise à jour : 2025-12-25

---

## 1) Philosophie

> **Tester ce qui compte, pas tout.**

En solo dev avec temps limité, les tests doivent :
- **Protéger le cœur métier** (moteur de simulation)
- **Prévenir les régressions critiques**
- **Ne pas ralentir le développement**

**Règle d'or** : Si un bug peut casser le calcul des indices ou le P&L → test obligatoire.

---

## 2) Pyramide de tests (adaptée solo dev)

```
                    ┌─────────────┐
                    │   E2E       │  ← Différé (V1+)
                    │  (manuel)   │
                    └─────────────┘
               ┌─────────────────────┐
               │    Intégration      │  ← Quelques tests clés
               │  (API Routes, DB)   │
               └─────────────────────┘
          ┌─────────────────────────────┐
          │        Unit Tests           │  ← PRIORITÉ
          │  (Moteur, utils, calculs)   │
          └─────────────────────────────┘
```

### Répartition cible MVP

| Type | % effort | Cible |
|------|----------|-------|
| **Unit tests** | 70% | Moteur de simulation (indices, leviers, événements) |
| **Intégration** | 20% | API Routes critiques (session, tour) |
| **E2E** | 10% | Manuel (un parcours complet avant release) |

---

## 3) Outils

### Stack de test

| Outil | Usage | Installation |
|-------|-------|--------------|
| **Vitest** | Tests unitaires | `npm install -D vitest` |
| **@testing-library/react** | Tests composants | `npm install -D @testing-library/react` |
| **happy-dom** | DOM virtuel (Vitest) | `npm install -D happy-dom` |

### Configuration Vitest

Créer `vitest.config.ts` à la racine :

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/engine/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Ajouter au `package.json` :

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 4) Quoi tester (priorités)

### Priorité 1 : Moteur de simulation (OBLIGATOIRE)

Le moteur (`src/lib/engine/`) est le cœur métier. Chaque fonction de calcul doit être testée.

| Module | Tests requis |
|--------|--------------|
| `engine.ts` | `resolveTurn()` avec différents états |
| `indices/iac.ts` | Calcul IAC avec variations de leviers |
| `indices/ipqo.ts` | Calcul IPQO avec charge/capacité |
| `indices/ierh.ts` | Calcul IERH avec effets RH |
| `indices/irf.ts` | Calcul IRF avec réassurance/provisions |
| `indices/imd.ts` | Calcul IMD avec investissements IT/Data |
| `indices/is.ts` | Calcul IS avec sincérité provisions |
| `indices/ipp.ts` | Calcul IPP (P&L pédagogique) |
| `events/*.ts` | Déclenchement et impact des événements |
| `levers/*.ts` | Application des leviers |

**Exemple de test moteur** :

```typescript
// tests/lib/engine/indices/iac.test.ts
import { describe, it, expect } from 'vitest';
import { calculateIAC } from '@/lib/engine/indices/iac';

describe('calculateIAC', () => {
  it('should increase IAC when pricing is competitive', () => {
    const state = { pricing: 'low', marketAvgPricing: 'medium' };
    const result = calculateIAC(state);
    expect(result).toBeGreaterThan(50);
  });

  it('should decrease IAC when pricing is too high', () => {
    const state = { pricing: 'high', marketAvgPricing: 'low' };
    const result = calculateIAC(state);
    expect(result).toBeLessThan(50);
  });

  it('should stay within 0-100 bounds', () => {
    const extremeState = { pricing: 'extreme_low', satisfaction: 0 };
    const result = calculateIAC(extremeState);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});
```

### Priorité 2 : Utilitaires critiques

| Module | Tests requis |
|--------|--------------|
| `lib/utils/calculations.ts` | Calculs mathématiques |
| `lib/utils/validators.ts` | Validation des entrées |

### Priorité 3 : API Routes (intégration)

| Route | Tests requis |
|-------|--------------|
| `POST /api/session` | Création session |
| `POST /api/engine/resolve` | Résolution de tour |

### Différé (pas en MVP)

- Tests de composants UI (sauf si logique complexe)
- Tests E2E automatisés (Playwright/Cypress)
- Tests de performance

---

## 5) Quand NE PAS tester

Pour rester productif, **ne pas tester** :

| Élément | Raison |
|---------|--------|
| Composants UI simples | Pas de logique, vérification visuelle suffit |
| Getters/setters triviaux | Valeur ajoutée nulle |
| Code tiers (Supabase, Next.js) | Déjà testé par les mainteneurs |
| Layouts et styles | Vérification manuelle |
| Configuration | Erreur visible immédiatement |

---

## 6) Conventions de tests

### Nommage

```
tests/
├── lib/
│   └── engine/
│       ├── indices/
│       │   ├── iac.test.ts
│       │   └── ipqo.test.ts
│       └── engine.test.ts
└── setup.ts
```

### Structure d'un fichier de test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionToTest } from '@/lib/module';

describe('functionToTest', () => {
  // Arrange global (optionnel)
  beforeEach(() => {
    // Reset state si nécessaire
  });

  describe('when condition A', () => {
    it('should do X', () => {
      // Arrange
      const input = { ... };
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      expect(() => functionToTest(null)).toThrow();
    });
  });
});
```

### Pattern AAA

Chaque test suit le pattern **Arrange-Act-Assert** :

```typescript
it('should calculate correct value', () => {
  // Arrange - préparer les données
  const state = createTestState({ rh: 50 });
  
  // Act - exécuter la fonction
  const result = calculateIERH(state);
  
  // Assert - vérifier le résultat
  expect(result).toBe(65);
});
```

---

## 7) Couverture de code

### Objectifs MVP

| Module | Couverture cible |
|--------|------------------|
| `lib/engine/**` | **80%+** |
| `lib/utils/**` | 60%+ |
| Reste | Pas de cible |

### Vérifier la couverture

```bash
npm run test:coverage
```

Rapport HTML généré dans `coverage/index.html`.

> **Attention** : La couverture n'est pas un objectif en soi. 80% de couverture sur du code trivial vaut moins que 50% sur du code critique bien testé.

---

## 8) Tests d'intégration

### Mocker Supabase

Pour les tests d'intégration, mocker le client Supabase :

```typescript
// tests/mocks/supabase.ts
import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue({ data: [], error: null }),
  insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
  // ...
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

---

## 9) Tests manuels (checklist release)

Avant chaque release, parcourir manuellement :

- [ ] Créer une session
- [ ] Choisir une compagnie
- [ ] Jouer 3 tours avec décisions variées
- [ ] Vérifier les variations d'indices
- [ ] Déclencher un événement (si possible)
- [ ] Aller jusqu'au debrief
- [ ] Exporter le PDF

---

## 10) Risques & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Tests trop longs** | Ralentissement dev | Moyenne | Focus unit tests, pas E2E MVP |
| **Moteur non testé** | Bugs calculs critiques | Haute si pas testé | Priorité absolue aux tests moteur |
| **Mocks incorrects** | Faux positifs | Moyenne | Quelques tests intégration réels |
| **Surcouverture UI** | Temps perdu | Moyenne | Ne pas tester composants triviaux |
| **Tests fragiles** | Maintenance lourde | Moyenne | Tester comportement, pas implémentation |

---

## 11) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| TEST-001 | Vitest comme framework | 2025-12 | Rapide, ESM natif, API Jest-like |
| TEST-002 | Focus moteur (80% couv) | 2025-12 | Cœur métier = priorité |
| TEST-003 | Pas d'E2E auto MVP | 2025-12 | Tests manuels pré-release suffisent |
| TEST-004 | happy-dom pour DOM | 2025-12 | Plus léger que jsdom |
| TEST-005 | Coverage que sur lib/engine | 2025-12 | Éviter bruit |

---

## 12) Checklist avant PR

- [ ] Tests existants passent (`npm run test:run`)
- [ ] Nouveaux tests pour nouvelle logique moteur
- [ ] Pas de `console.log` dans les tests
- [ ] Pas de `.only` ou `.skip` oubliés
