# Working Agreement — Antigravity × AssurManager

> **Source of Truth** pour les règles de collaboration humain-IA.
> Dernière mise à jour : 2025-12-26

---

## 1) Règle d'or

> **1 ticket = 1 branche = 1 PR = 1 scope**

Aucune déviation. Si une tâche révèle un besoin connexe, créer une nouvelle issue.

---

## 2) Scope d'intervention

### ✅ Autorisé

| Action | Conditions |
|--------|------------|
| Créer/modifier des fichiers `docs/**` | Dans le scope de la demande |
| Créer/modifier du code `src/**`, `lib/**` | Référencé par une US/issue |
| Ajouter des tests | Toujours autorisé |
| Proposer des alternatives | Avec `[OPTION A]` / `[OPTION B]` + recommandation |

### ❌ Interdit

| Action | Alternative |
|--------|-------------|
| Refactorer "parce que c'est mieux" | Créer une issue dédiée |
| Ajouter des features hors US | Taguer `[OUT OF SCOPE]`, noter pour V1+ |
| Modifier des migrations sans validation | Voir [§5 Garde-fous](#5-garde-fous-critiques) |
| Supprimer du code fonctionnel | Sauf si explicitement demandé |
| Push direct sur `main` ou `dev` | Toujours via PR |

---

## 3) Gestion des questions ouvertes

### Format obligatoire

```markdown
> [!IMPORTANT]
> **[OPEN QUESTION]** Titre de la question
>
> **Contexte** : Pourquoi cette question se pose
>
> | Option | Avantages | Inconvénients |
> |--------|-----------|---------------|
> | A | ... | ... |
> | B | ... | ... |
>
> **Recommandation** : Option X parce que...
```

### Règles

1. **Ne jamais décider seul** sur les sujets structurants
2. **Proposer 2 options minimum** + recommandation argumentée
3. **Documenter la décision** une fois validée dans la section "Décisions actées"

---

## 4) Format des livrables

### Documentation

Chaque document doit contenir :

```markdown
# Titre — AssurManager

> **Source of Truth** pour [sujet].
> Dernière mise à jour : YYYY-MM-DD

---

## 1) Contenu principal
...

## N) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| XXX-001 | ... | 2025-12 | ... |

## N+1) Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| ... | ... | ... |
```

### Code

- Commits : `<type>(<scope>): <description>` (voir [commit_convention.md](../60_github/commit_convention.md))
- Référence US obligatoire : `US-XXX` dans le footer
- Tests si moteur modifié

---

## 5) Garde-fous critiques

### Zones à validation obligatoire

> [!CAUTION]
> **Ces zones nécessitent un plan écrit AVANT exécution**

| Zone | Processus |
|------|-----------|
| **Migrations SQL** | 1. Écrire le plan → 2. Validation humaine → 3. Exécution |
| **Sécurité / RBAC** | 1. Plan + matrice impacts → 2. Validation → 3. Implémentation |
| **Schéma API** | 1. Spec + breaking changes → 2. Validation → 3. Code |
| **Suppression de données** | 1. Plan + backup → 2. Validation → 3. Exécution |

### Template plan de migration

```markdown
## Plan de migration : [nom]

### Objectif
[Description courte]

### Changements SQL
```sql
-- UP
ALTER TABLE ...

-- DOWN (rollback)
ALTER TABLE ...
```

### Impact
- [ ] Tables affectées : ...
- [ ] Données existantes : [migration nécessaire ?]
- [ ] Temps estimé : ...
- [ ] Risque de downtime : Oui/Non

### Validation requise
- [ ] Review humain
- [ ] Test sur environnement dev
- [ ] Backup avant exécution
```

---

## 6) Communication

### Signaux d'alerte

Utiliser les alertes GitHub dans les docs et PR :

```markdown
> [!NOTE]
> Information contextuelle

> [!TIP]
> Suggestion d'amélioration

> [!IMPORTANT]
> Décision ou action requise

> [!WARNING]
> Risque identifié

> [!CAUTION]
> Danger - nécessite validation
```

### Blocages

Si bloqué sur une question :
1. **Documenter** le blocage explicitement
2. **Proposer** des contournements temporaires si possible
3. **Attendre** la réponse (pas d'improvisation)

---

## 7) Checklist avant PR

```markdown
## Checklist Working Agreement

- [ ] Scope = US référencée uniquement
- [ ] Pas de refactor non demandé
- [ ] Questions ouvertes documentées avec 2 options
- [ ] Zones sensibles : plan validé avant exécution
- [ ] Documentation à jour
- [ ] Tests si applicable
```

---

## 8) Décisions actées

| ID | Décision | Date | Contexte |
|----|----------|------|----------|
| WA-001 | 1 ticket = 1 PR strict | 2025-12 | Éviter le scope creep |
| WA-002 | Migrations = plan obligatoire | 2025-12 | Sécurité données |
| WA-003 | Open Questions = 2 options min | 2025-12 | Décisions tracées |
| WA-004 | Refactors spontanés interdits | 2025-12 | Focus MVP |

---

## 9) Quick Reference

```
╔═══════════════════════════════════════════════════════════════╗
║                    WORKING AGREEMENT                          ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ 1 ticket = 1 PR (strict)                                  ║
║  ✅ Questions → [OPEN QUESTION] + 2 options                   ║
║  ✅ Migrations / Sécu → Plan + validation AVANT               ║
║  ✅ Hors scope → [OUT OF SCOPE] + nouvelle issue              ║
╠═══════════════════════════════════════════════════════════════╣
║  ❌ Refactor non demandé                                      ║
║  ❌ Features hors US                                          ║
║  ❌ Décision structurante en solo                             ║
║  ❌ Push direct main/dev                                      ║
╚═══════════════════════════════════════════════════════════════╝
```
