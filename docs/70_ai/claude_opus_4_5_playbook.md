# Claude Opus 4.5 Playbook — AssurManager

> **Guide opérationnel** pour Claude travaillant sur ce projet.
> Dernière mise à jour : 2025-12-26

---

## 1) Onboarding rapide

### Lecture obligatoire (ordre)

```
1. docs/README.md              → Index et navigation
2. docs/00_product/prd.md      → Vision produit
3. docs/00_product/scope.md    → Ce qui est IN/OUT du MVP
4. docs/00_product/glossary.md → Vocabulaire IARD
5. docs/70_ai/working_agreement.md → Règles de collaboration
```

### Selon la tâche

| Type de tâche | Docs supplémentaires |
|---------------|----------------------|
| Moteur simulation | `20_simulation/indices.md` → `leviers_catalogue.md` |
| Code/Engineering | `40_engineering/stack.md` → `project_structure.md` |
| Sécurité | `50_security_compliance/auth_rbac.md` |
| GitHub/PR | `60_github/workflow.md` → `pr_template.md` |

---

## 2) Patterns à utiliser

### Démarrage de tâche

```markdown
## ✅ Compréhension de la demande

**US/Issue** : US-XXX / #YYY
**Scope** : [description courte]
**Fichiers concernés** : [liste]
**Hors scope** : [ce que je NE ferai PAS]

## 📋 Plan d'exécution

1. [ ] Étape 1
2. [ ] Étape 2
3. [ ] Étape 3
```

### Question ouverte

```markdown
> [!IMPORTANT]
> **[OPEN QUESTION]** Comment gérer X ?
>
> | Option | Avantages | Inconvénients |
> |--------|-----------|---------------|
> | A : ... | ... | ... |
> | B : ... | ... | ... |
>
> **Recommandation** : Option A parce que...
```

### Signaler hors scope

```markdown
> [!NOTE]
> **[OUT OF SCOPE MVP]** Fonctionnalité Y
>
> Non implémenté car hors périmètre actuel.
> Candidat pour V1+ si validé. Issue à créer : #ZZZ
```

---

## 3) Anti-patterns à éviter

| ❌ Ne pas faire | ✅ Faire à la place |
|-----------------|---------------------|
| "J'ai aussi refactoré X" | S'en tenir au scope demandé |
| "J'ai ajouté cette feature utile" | Créer une issue séparée |
| Décider seul sur un sujet ambigu | `[OPEN QUESTION]` + options |
| Modifier une migration en cours | Plan écrit + validation |
| Push direct sans PR | Toujours créer PR |
| "Ça dépend" sans précision | Quantifier ou proposer des options |

---

## 4) Commandes utiles

### Avant de coder

```bash
# Vérifier l'état
git status
git log -3 --oneline

# Créer branche
git checkout dev && git pull
git checkout -b feat/US-XXX-description
```

### Validation

```bash
npm run build        # Build sans erreur
npm run type-check   # Types OK
npm run lint         # Lint OK
npm run test:run     # Tests passent
```

### Fin de tâche

```bash
git push -u origin feat/US-XXX-description
# → Créer PR avec template
```

---

## 5) Format des commits

```
<type>(<scope>): <description>

[body optionnel]

US-XXX
```

### Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction bug |
| `docs` | Documentation |
| `test` | Tests |
| `refactor` | Refactoring (demandé) |
| `chore` | Maintenance |

### Scopes

| Scope | Périmètre |
|-------|-----------|
| `engine` | Moteur simulation |
| `ui` | Composants UI |
| `api` | Routes API |
| `db` | Base de données |
| `auth` | Authentification |

---

## 6) Zones sensibles

### Avant d'intervenir, créer un plan

| Zone | Signal d'alerte |
|------|-----------------|
| `supabase/migrations/` | Nouvelle migration ou modif |
| `lib/engine/` | Changement de formule |
| Fichiers `auth*`, `rbac*` | Modification permissions |
| Suppression de fichiers | Tout fichier |

### Template plan

```markdown
## Plan d'intervention : [zone]

### Objectif
[Description]

### Changements prévus
- Fichier 1 : [modification]
- Fichier 2 : [modification]

### Rollback
[Comment annuler si problème]

### Validation requise
- [ ] Review humain avant exécution
```

---

## 7) Réponses types

### Tâche terminée

```markdown
## ✅ Tâche complétée

**US/Issue** : US-XXX
**Branche** : `feat/US-XXX-description`

### Changements
- `fichier1.ts` : [description]
- `fichier2.md` : [description]

### Tests
- [x] Build OK
- [x] Lint OK  
- [x] Tests passent

### PR
[Lien vers PR ou "à créer"]
```

### Blocage

```markdown
## ⚠️ Blocage identifié

**Cause** : [description]

**Options** :
1. [Option A] - [conséquence]
2. [Option B] - [conséquence]

**Recommandation** : Option X

**En attente de** : Décision humaine
```

---

## 8) Checklist mentale

Avant chaque action, vérifier :

```
□ Est-ce dans le scope de l'US ?
□ Ai-je lu les docs pertinentes ?
□ Est-ce une zone sensible ?
□ Ai-je un plan si migration/sécu ?
□ Les tests passent-ils ?
□ Mon commit est-il bien formaté ?
```

---

## 9) Quick Reference

```
╔═══════════════════════════════════════════════════════════════╗
║                  CLAUDE OPUS PLAYBOOK                         ║
╠═══════════════════════════════════════════════════════════════╣
║  LIRE   : README → PRD → scope → glossary → working_agreement ║
║  SCOPE  : 1 US = 1 PR, rien de plus                           ║
║  DOUTE  : [OPEN QUESTION] + 2 options + recommandation        ║
║  SÉCU   : Plan écrit AVANT d'intervenir                       ║
║  FIN    : Build + Lint + Tests → PR avec template             ║
╠═══════════════════════════════════════════════════════════════╣
║  COMMIT : feat(scope): description [US-XXX]                   ║
║  BRANCH : feat/US-XXX-description                             ║
╚═══════════════════════════════════════════════════════════════╝
```
