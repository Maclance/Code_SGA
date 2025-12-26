# Commit Convention — AssurManager

> **Source of Truth** pour les conventions de commits.
> Basé sur [Conventional Commits](https://www.conventionalcommits.org/)
> Dernière mise à jour : 2025-12-26

---

## 1) Format

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

### Règles

- **Première ligne** : max 72 caractères
- **Type** : obligatoire, en minuscules
- **Scope** : recommandé, entre parenthèses
- **Description** : impératif présent ("add" pas "added")
- **Body** : si besoin d'explication détaillée
- **Footer** : références US/issues

---

## 2) Types autorisés

| Type | Quand l'utiliser | Exemple |
|------|------------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(engine): add IAC calculation` |
| `fix` | Correction de bug | `fix(cockpit): correct rounding display` |
| `refactor` | Changement de code sans changer le comportement | `refactor(utils): simplify clamp function` |
| `docs` | Documentation uniquement | `docs: update README setup instructions` |
| `test` | Ajout ou modification de tests | `test(engine): add edge case tests for P&L` |
| `chore` | Maintenance, config, dépendances | `chore: upgrade vitest to 2.1` |
| `style` | Formatage (espaces, virgules, etc.) | `style: fix eslint warnings` |
| `perf` | Amélioration de performance | `perf(engine): cache lever calculations` |
| `ci` | Configuration CI/CD | `ci: add build check to workflow` |
| `build` | Changement système de build | `build: update vite config` |

---

## 3) Scopes recommandés

| Scope | Correspond à |
|-------|--------------|
| `engine` | `lib/engine/` — Moteur de simulation |
| `cockpit` | Composants cockpit/dashboard |
| `ui` | Composants UI génériques |
| `api` | Routes API (`app/api/`) |
| `db` | Migrations, Supabase |
| `auth` | Authentification, sessions |
| `config` | Configuration (env, vite, etc.) |
| `deps` | Dépendances |
| *(vide)* | Changement transversal |

---

## 4) Exemples complets

### Feature simple

```
feat(engine): implement IAC calculation

- Add calculateIAC function with pricing and satisfaction factors
- Formula: IAC = 0.6 * tarif_score + 0.4 * satisfaction
- Values clamped to [0, 100]

US-020
```

### Bugfix avec référence issue

```
fix(cockpit): correct index display rounding

Indices were showing 3 decimals instead of integers.
Changed from toFixed(3) to Math.round().

Fixes #42
```

### Refactor demandé

```
refactor(engine): extract common validation logic

Move repeated validation into shared validateRange() utility.
No behavior change, all tests pass.

Part of US-025
```

### Chore (dépendances)

```
chore(deps): upgrade vitest to 2.1.0

Breaking changes handled:
- Updated mock syntax
- Fixed async test timeout config
```

### Documentation

```
docs: add API specification to 80_api_data

- Document REST endpoints
- Add request/response examples
- Include error codes
```

### Test seul

```
test(engine): add edge case tests for P&L calculation

- Test with zero premiums
- Test with negative expenses
- Test boundary conditions
```

### Hotfix

```
hotfix: fix critical auth session crash

Users were logged out immediately after login due to
incorrect token refresh timing.

Production impact: all users affected
```

---

## 5) Bonnes pratiques

### ✅ À faire

```bash
# Impératif présent
feat(engine): add calculation  ✅
feat(engine): added calculation  ❌

# Minuscules pour type
feat: something  ✅
Feat: something  ❌
FEAT: something  ❌

# Description concise
fix(ui): correct button alignment  ✅
fix(ui): this commit fixes the issue where buttons were not aligned properly  ❌

# Scope précis
feat(engine): add IAC formula  ✅
feat: add IAC formula to engine  ❌
```

### ❌ À éviter

```bash
# Trop vague
fix: bug  ❌
feat: update  ❌
chore: stuff  ❌

# Trop long
feat(engine): implement the new IAC calculation system with all the 
necessary validations and error handling (limit 72 chars)  ❌

# Type incorrect
feature: add button  ❌  # Use "feat"
bugfix: correct error  ❌  # Use "fix"
```

---

## 6) Références dans le footer

| Pattern | Usage |
|---------|-------|
| `US-XXX` | Référence User Story |
| `Fixes #XXX` | Ferme automatiquement l'issue |
| `Closes #XXX` | Ferme automatiquement l'issue |
| `Refs #XXX` | Mentionne sans fermer |
| `Part of US-XXX` | Contribution partielle à une US |

### Exemples

```
feat(engine): add lever validation

Validates lever inputs before applying to simulation.

US-030
Refs #45
```

```
fix(auth): prevent session timeout bug

Fixes #42
Fixes #43
```

---

## 7) Commits multiples vs atomiques

### Préférer les commits atomiques

```bash
# ✅ Bon : commits séparés et clairs
git commit -m "feat(engine): add IAC base formula"
git commit -m "test(engine): add IAC unit tests"
git commit -m "docs(engine): add IAC JSDoc comments"

# ❌ Mauvais : un gros commit fourre-tout
git commit -m "feat(engine): add IAC with tests and docs"
```

### Quand regrouper (squash)

Lors du merge PR vers dev/main, les commits peuvent être squashés si :
- Commits de "work in progress"
- Commits de correction de typos
- Commits "oops j'ai oublié"

---

## 8) Intégration avec la CI

Les commits avec certains types peuvent déclencher des actions :

| Type | Action CI potentielle |
|------|----------------------|
| `feat`, `fix` | Tests + Build + Deploy preview |
| `docs` | Skip CI (optionnel) |
| `chore(deps)` | Security scan |
| `ci` | CI workflow uniquement |

### Skip CI (à utiliser avec prudence)

```
docs: fix typo in README

[skip ci]
```

---

## 9) Quick Reference Card

```
╔════════════════════════════════════════════════════════════════╗
║                    COMMIT CONVENTION                           ║
╠════════════════════════════════════════════════════════════════╣
║  Format: <type>(<scope>): <description>                        ║
╠════════════════════════════════════════════════════════════════╣
║  Types:                                                        ║
║    feat     → nouvelle fonctionnalité                          ║
║    fix      → correction de bug                                ║
║    refactor → refactoring (même comportement)                  ║
║    docs     → documentation                                    ║
║    test     → tests                                            ║
║    chore    → maintenance                                      ║
║    style    → formatage                                        ║
║    perf     → performance                                      ║
║    ci       → CI/CD                                            ║
╠════════════════════════════════════════════════════════════════╣
║  Footer: US-XXX | Fixes #XX | Closes #XX | Refs #XX            ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 10) Décisions actées

| ID | Décision | Date |
|----|----------|------|
| CC-001 | Utiliser Conventional Commits | 2025-12 |
| CC-002 | Scopes alignés sur structure projet | 2025-12 |
| CC-003 | Footer avec référence US obligatoire pour `feat` | 2025-12 |
| CC-004 | Squash merge autorisé sur PR | 2025-12 |
