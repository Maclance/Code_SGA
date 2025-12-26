# PR Template — AssurManager

> **Source of Truth** pour le template de Pull Request.
> À copier dans `.github/PULL_REQUEST_TEMPLATE.md`

---

## Template à copier

```markdown
## 📋 Description

<!-- Résumé clair de ce que fait cette PR (2-3 phrases max) -->


## 🎯 Lien vers la tâche

<!-- Référence à l'US ou issue -->
- US: `US-XXX`
- Issue: Fixes #XXX

## 📝 Type de changement

<!-- Cocher ce qui s'applique -->
- [ ] 🆕 Feature (nouvelle fonctionnalité)
- [ ] 🐛 Bugfix (correction de bug)
- [ ] 🔧 Refactor (refactoring sans changement de comportement)
- [ ] 📚 Docs (documentation uniquement)
- [ ] 🧹 Chore (maintenance, dépendances)
- [ ] 🚨 Hotfix (correctif urgent production)

## ✅ Checklist QA

### Build & CI
- [ ] `npm run build` passe sans erreur
- [ ] `npm run type-check` passe sans erreur
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run test:run` passe sans erreur

### Code Quality
- [ ] Pas de `console.log` en production
- [ ] Pas de code commenté sans `TODO`/`FIXME`
- [ ] Pas de `any` sans justification
- [ ] Nommage conforme aux conventions

### Tests
- [ ] Tests existants passent
- [ ] Tests ajoutés si logique moteur modifiée
- [ ] Couverture moteur ≥ 80% maintenue

### Documentation
- [ ] README mis à jour si nouveau setup
- [ ] JSDoc pour fonctions publiques complexes

### Sécurité
- [ ] Pas de secrets hardcodés
- [ ] Pas de données sensibles exposées

## 📸 Captures d'écran

<!-- Si UI modifiée, ajouter avant/après -->
| Avant | Après |
|-------|-------|
| <!-- screenshot --> | <!-- screenshot --> |

## 🧪 Comment tester

<!-- Étapes pour tester manuellement cette PR -->
1. 
2. 
3. 

## ⚠️ Points d'attention

<!-- Risques, effets de bord potentiels, décisions importantes -->


## 📚 Documentation liée

<!-- Liens vers docs pertinentes -->
- 

---

> ✨ **Rappel**: Si ce n'est pas dans l'US, ça ne devrait pas être dans cette PR.
```

---

## Utilisation

### Installation dans le repo

Créer le fichier `.github/PULL_REQUEST_TEMPLATE.md` avec le contenu ci-dessus (entre les ```) pour qu'il s'applique automatiquement à chaque nouvelle PR.

```bash
mkdir -p .github
# Copier le template
```

### Exemples de PR complétées

#### Feature PR

```markdown
## 📋 Description

Implémentation du calcul de l'Indice d'Attractivité Commerciale (IAC).
Le calcul prend en compte le positionnement tarifaire et la satisfaction client.

## 🎯 Lien vers la tâche

- US: `US-020`

## 📝 Type de changement

- [x] 🆕 Feature (nouvelle fonctionnalité)

## ✅ Checklist QA

### Build & CI
- [x] `npm run build` passe sans erreur
- [x] `npm run type-check` passe sans erreur
- [x] `npm run lint` passe sans erreur
- [x] `npm run test:run` passe sans erreur

### Code Quality
- [x] Pas de `console.log` en production
- [x] Pas de code commenté sans `TODO`/`FIXME`
- [x] Pas de `any` sans justification
- [x] Nommage conforme aux conventions

### Tests
- [x] Tests existants passent
- [x] Tests ajoutés si logique moteur modifiée
- [x] Couverture moteur ≥ 80% maintenue

### Documentation
- [x] README mis à jour si nouveau setup
- [x] JSDoc pour fonctions publiques complexes

### Sécurité
- [x] Pas de secrets hardcodés
- [x] Pas de données sensibles exposées

## 🧪 Comment tester

1. Lancer `npm run test:run` pour vérifier les tests unitaires
2. Lancer le jeu en mode Novice
3. Vérifier que l'IAC s'affiche dans le cockpit (valeur entre 0-100)

## ⚠️ Points d'attention

La formule utilise une pondération 60/40 entre tarif et satisfaction.
Voir `indices.md` pour les détails.
```

#### Bugfix PR

```markdown
## 📋 Description

Correction de l'arrondi des indices dans le cockpit.
Les indices affichaient 3 décimales au lieu d'entiers.

## 🎯 Lien vers la tâche

- Issue: Fixes #42

## 📝 Type de changement

- [x] 🐛 Bugfix (correction de bug)

## ✅ Checklist QA

### Build & CI
- [x] `npm run build` passe sans erreur
- [x] `npm run type-check` passe sans erreur
- [x] `npm run lint` passe sans erreur
- [x] `npm run test:run` passe sans erreur

### Tests
- [x] Tests existants passent
- [x] Tests ajoutés si logique moteur modifiée (test de non-régression)

## 🧪 Comment tester

1. Ouvrir le cockpit de jeu
2. Vérifier que tous les indices affichent des entiers (pas de décimales)

## ⚠️ Points d'attention

Root cause : le formatage utilisait `toFixed(3)` au lieu de `Math.round()`.
```

---

## Décisions actées

| ID | Décision | Date |
|----|----------|------|
| PR-001 | Checklist QA obligatoire | 2025-12 |
| PR-002 | Screenshots obligatoires si UI | 2025-12 |
| PR-003 | Référence US/Issue obligatoire | 2025-12 |
