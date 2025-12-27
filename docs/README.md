# 📚 Documentation — AssurManager : Le Défi IARD

> **Index actionnable** de toute la documentation du projet.  
> Dernière mise à jour : 2025-12-26

---

## 📋 Table des Matières

- [Sources de Vérité](#-sources-de-vérité)
- [Ordre de Lecture Recommandé (Antigravity)](#-ordre-de-lecture-recommandé-antigravity)
- [Ce qui est Contractuel vs Références](#-ce-qui-est-contractuel-vs-références)
- [Arborescence Complète](#-arborescence-complète)
- [Consolidation des Redondances](#-consolidation-des-redondances)
- [Documents Manquants](#-documents-manquants)
- [Règles de Contribution](#-règles-de-contribution)

---

## 🎯 Sources de Vérité

Chaque domaine a une **source unique** qui fait autorité. Les autres documents peuvent y faire référence mais ne doivent **jamais dupliquer** les définitions.

### Produit (stratégie & périmètre)

| Document | Description |
|----------|-------------|
| [`00_product/prd.md`](./00_product/prd.md) | Vision produit, objectifs, fonctionnalités |
| [`00_product/scope.md`](./00_product/scope.md) | Périmètre MVP/V1/V2, hypothèses, hors scope |
| [`00_product/backlog.md`](./00_product/backlog.md) | User stories, priorités P0/P1/P2, critères d'acceptation |
| [`00_product/glossary.md`](./00_product/glossary.md) | Vocabulaire métier IARD + termes du jeu |
| [`00_product/personas.md`](./00_product/personas.md) | Utilisateurs cibles, jobs-to-be-done |
| [`00_product/kpi_success.md`](./00_product/kpi_success.md) | Métriques produit, formules, conventions |

### Simulation (moteur de jeu)

| Document | Description |
|----------|-------------|
| [`20_simulation/overview.md`](./20_simulation/overview.md) | Architecture du moteur, flux de données |
| [`20_simulation/indices.md`](./20_simulation/indices.md) | **Spécification technique** des 7 indices + 13 secondaires, formules, invariants |
| [`20_simulation/leviers_catalogue.md`](./20_simulation/leviers_catalogue.md) | **Implémentation technique** des leviers, schémas TS |
| [`20_simulation/events_catalogue.md`](./20_simulation/events_catalogue.md) | Catalogue d'événements marché/compagnie |
| [`20_simulation/formules.md`](./20_simulation/formules.md) | Formules mathématiques détaillées |
| [`20_simulation/effets_retard.md`](./20_simulation/effets_retard.md) | Système d'effets retard/persistance |
| [`20_simulation/aleatoire_seeds.md`](./20_simulation/aleatoire_seeds.md) | Gestion aléatoire reproductible |
| [`20_simulation/invariants.md`](./20_simulation/invariants.md) | **Consolidation** des invariants (INV-*) |
| [`20_simulation/test_vectors.json`](./20_simulation/test_vectors.json) | Cas de test Given/When/Then pour validation formules |
| [`20_simulation/config/`](./20_simulation/config/) | Fichiers YAML de configuration |

### Game Design (mécaniques de jeu)

| Document | Description |
|----------|-------------|
| [`10_game_design/gameplay_core.md`](./10_game_design/gameplay_core.md) | Boucle de jeu, phases, mécaniques fondamentales |
| [`10_game_design/modes_difficultes.md`](./10_game_design/modes_difficultes.md) | Paramètres par niveau de difficulté |
| [`10_game_design/scoring_badges_debrief.md`](./10_game_design/scoring_badges_debrief.md) | Système de scoring, badges, débrief |
| [`10_game_design/contenu_pedagogique.md`](./10_game_design/contenu_pedagogique.md) | Contenu éducatif, compagnies, tutoriel |
| [`10_game_design/roles_multijoueur.md`](./10_game_design/roles_multijoueur.md) | Rôles utilisateurs, architecture V1 |
| [`10_game_design/audit_alignement_pedagogique.md`](./10_game_design/audit_alignement_pedagogique.md) | Audit pédagogique |

### Engineering (développement)

| Document | Description |
|----------|-------------|
| [`40_engineering/stack.md`](./40_engineering/stack.md) | Stack technique (Next.js, Supabase, Vercel) |
| [`40_engineering/project_structure.md`](./40_engineering/project_structure.md) | Structure du projet, conventions |
| [`40_engineering/env_setup.md`](./40_engineering/env_setup.md) | Configuration environnement local |
| [`40_engineering/ci_cd.md`](./40_engineering/ci_cd.md) | Pipeline CI/CD, déploiement |
| [`40_engineering/testing_strategy.md`](./40_engineering/testing_strategy.md) | Stratégie de test (Vitest) |
| [`40_engineering/dependencies_policy.md`](./40_engineering/dependencies_policy.md) | Politique de dépendances |
| [`40_engineering/definition_of_done.md`](./40_engineering/definition_of_done.md) | Critères de terminaison |

### Sécurité & Conformité

| Document | Description |
|----------|-------------|
| [`50_security_compliance/auth_rbac.md`](./50_security_compliance/auth_rbac.md) | Authentification, RBAC, matrice permissions |
| [`50_security_compliance/multi_tenant_isolation.md`](./50_security_compliance/multi_tenant_isolation.md) | Isolation multi-tenant, RLS |
| [`50_security_compliance/audit_log.md`](./50_security_compliance/audit_log.md) | Journalisation, traçabilité |
| [`50_security_compliance/rgpd.md`](./50_security_compliance/rgpd.md) | Conformité RGPD |

### GitHub (workflow & conventions)

| Document | Description |
|----------|-------------|
| [`60_github/workflow.md`](./60_github/workflow.md) | Stratégie de branches main/dev/feat/* |
| [`60_github/pr_template.md`](./60_github/pr_template.md) | Template de Pull Request avec checklist QA |
| [`60_github/commit_convention.md`](./60_github/commit_convention.md) | Convention de commits (Conventional Commits) |
| [`60_github/release_process.md`](./60_github/release_process.md) | Processus de release, versioning SemVer |

### API & Data

| Document | Description |
|----------|-------------|
| [`80_api_data/data_model.md`](./80_api_data/data_model.md) | Modèle de données, entités, contraintes, RLS |
| [`80_api_data/api_contract.md`](./80_api_data/api_contract.md) | Contrat API REST, endpoints, erreurs |
| [`80_api_data/instrumentation_plan.md`](./80_api_data/instrumentation_plan.md) | Plan analytics, catalogue d'événements |
| [`80_api_data/kpi_definitions.md`](./80_api_data/kpi_definitions.md) | Définitions KPIs, formules, fenêtres |

### IA / Antigravity

| Document | Description |
|----------|-------------|
| [`70_ai/roles_pack.md`](./70_ai/roles_pack.md) | Rôles pour Antigravity, prompts, méthodes |
| [`70_ai/working_agreement.md`](./70_ai/working_agreement.md) | Règles de collaboration, garde-fous, scope |
| [`70_ai/claude_opus_4_5_playbook.md`](./70_ai/claude_opus_4_5_playbook.md) | Guide opérationnel Claude |
| [`70_ai/prompt_templates.md`](./70_ai/prompt_templates.md) | Bibliothèque de prompts réutilisables |

---

## 🚀 Ordre de Lecture Recommandé (Antigravity)

Pour une IA agent travaillant sur ce projet, voici la séquence optimale :

### Étape 1 : Contexte (obligatoire, ~10 min)

1. [`00_product/prd.md`](./00_product/prd.md) — Vision complète du produit
2. [`00_product/scope.md`](./00_product/scope.md) — Ce qui est IN/OUT du MVP
3. [`00_product/glossary.md`](./00_product/glossary.md) — Vocabulaire métier à maîtriser

### Étape 2 : Selon la tâche

| Type de tâche | Documents à lire |
|---------------|------------------|
| **Simulation / Moteur** | `20_simulation/overview.md` → `indices.md` → `leviers_catalogue.md` → `formules.md` |
| **Game Design / UX** | `10_game_design/gameplay_core.md` → `modes_difficultes.md` → `30_ux_ui/user_flows.md` |
| **Développement** | `40_engineering/stack.md` → `project_structure.md` → `testing_strategy.md` |
| **Sécurité / Auth** | `50_security_compliance/auth_rbac.md` → `multi_tenant_isolation.md` |
| **Contenu Pédagogique** | `10_game_design/contenu_pedagogique.md` → `scoring_badges_debrief.md` |
| **KPIs / Analytics** | `00_product/kpi_success.md` → `backlog.md` (E7) |

### Étape 3 : Prompts Antigravity

4. [`70_ai/roles_pack.md`](./70_ai/roles_pack.md) — Rôles et méthodes pour chaque type de tâche

---

## 📜 Ce qui est Contractuel vs Références

### ✅ Documents Contractuels (engagent le périmètre MVP)

Ces documents définissent le **périmètre engagé**. Toute modification impacte le planning/budget.

| Document | Contenu engageant |
|----------|-------------------|
| [`prd.md`](./00_product/prd.md) | Fonctionnalités MVP, modes de jeu, architecture produit |
| [`scope.md`](./00_product/scope.md) | Périmètre MVP précis, hypothèses, hors scope explicite |
| [`backlog.md`](./00_product/backlog.md) | User stories P0 (indispensables), critères d'acceptation |
| [`20_simulation/indices.md`](./20_simulation/indices.md) | Les 7 indices, leurs formules et invariants |
| [`20_simulation/leviers_catalogue.md`](./20_simulation/leviers_catalogue.md) | Leviers MVP, disponibilité par difficulté, effets |

### 📖 Documents de Référence (explicatifs, évolutifs)

Ces documents **clarifient** et **guident** mais peuvent évoluer sans impact contractuel.

| Catégorie | Documents |
|-----------|-----------|
| **Produit** | `glossary.md`, `personas.md`, `kpi_success.md`, `traceability_feedback_iard.md` |
| **Game Design** | `gameplay_core.md`, `modes_difficultes.md`, `scoring_badges_debrief.md`, `contenu_pedagogique.md`, `roles_multijoueur.md` |
| **Simulation** | `overview.md`, `formules.md`, `effets_retard.md`, `aleatoire_seeds.md`, `events_catalogue.md` |
| **UX/UI** | `user_flows.md`, `screens_spec.md`, `design_system.md`, `accessibilite.md` |
| **Engineering** | Tous les fichiers `40_engineering/` |
| **Sécurité** | Tous les fichiers `50_security_compliance/` |
| **IA** | `roles_pack.md` |

---

## 📂 Arborescence Complète

```
docs/
├── 00_product/                    # 🎯 PRODUIT — 9 fichiers
│   ├── prd.md                     # PRD complet (654 lignes)
│   ├── scope.md                   # Scope MVP/V1/V2, hypothèses
│   ├── backlog.md                 # Backlog avec US et AC
│   ├── glossary.md                # Glossaire métier + jeu
│   ├── indices.md                 # Vue métier des 7 indices
│   ├── leviers_catalogue.md       # Vue métier des leviers
│   ├── personas.md                # Personas utilisateurs
│   ├── kpi_success.md             # KPIs et métriques
│   └── traceability_feedback_iard.md  # Traçabilité feedback IARD
│
├── 10_game_design/                # 🎮 GAME DESIGN — 6 fichiers
│   ├── gameplay_core.md           # Boucle de jeu, phases
│   ├── modes_difficultes.md       # Novice/Intermédiaire/Expert
│   ├── scoring_badges_debrief.md  # Scoring, badges, debrief
│   ├── contenu_pedagogique.md     # Compagnies, tutoriel
│   ├── roles_multijoueur.md       # Rôles MVP et V1
│   └── audit_alignement_pedagogique.md  # Audit pédagogique
│
├── 20_simulation/                 # 🔧 SIMULATION — 9 fichiers + config/
│   ├── overview.md                # Architecture du moteur
│   ├── indices.md                 # Spécification technique (1350 lignes)
│   ├── leviers_catalogue.md       # Implémentation technique (1820 lignes)
│   ├── events_catalogue.md        # Catalogue d'événements
│   ├── formules.md                # Formules mathématiques
│   ├── effets_retard.md           # Système de persistance
│   ├── aleatoire_seeds.md         # Gestion aléatoire
│   ├── invariants.md              # Consolidation invariants (INV-*)
│   ├── test_vectors.json          # Cas de test (Given/When/Then)
│   └── config/
│       ├── defaults_by_difficulty.yaml  # Paramètres par difficulté
│       ├── events.yaml                  # Définitions événements
│       └── schema_config.yaml           # Schéma de configuration
│
├── 30_ux_ui/                      # 🎨 UX/UI — 4 fichiers
│   ├── user_flows.md              # Parcours utilisateur
│   ├── screens_spec.md            # Spécifications écrans
│   ├── design_system.md           # Système de design
│   └── accessibilite.md           # Accessibilité (a11y)
│
├── 40_engineering/                # ⚙️ ENGINEERING — 7 fichiers
│   ├── stack.md                   # Stack technique
│   ├── project_structure.md       # Structure projet
│   ├── env_setup.md               # Configuration environnement
│   ├── ci_cd.md                   # Pipeline CI/CD
│   ├── testing_strategy.md        # Stratégie de test
│   ├── dependencies_policy.md     # Politique dépendances
│   └── definition_of_done.md      # DoD
│
├── 50_security_compliance/        # 🔒 SÉCURITÉ — 4 fichiers
│   ├── auth_rbac.md               # Authentification + RBAC
│   ├── multi_tenant_isolation.md  # Isolation multi-tenant
│   ├── audit_log.md               # Journalisation
│   └── rgpd.md                    # Conformité RGPD
│
├── 60_github/                     # 📦 GITHUB — 4 fichiers
│   ├── workflow.md                # Stratégie de branches main/dev/feat/*
│   ├── pr_template.md             # Template de Pull Request
│   ├── commit_convention.md       # Convention de commits
│   └── release_process.md         # Processus de release
│
├── 70_ai/                         # 🤖 IA — 4 fichiers
│   ├── roles_pack.md              # Pack de rôles Antigravity
│   ├── working_agreement.md       # Règles de collaboration
│   ├── claude_opus_4_5_playbook.md # Guide opérationnel Claude
│   └── prompt_templates.md        # Bibliothèque de prompts
│
├── 80_api_data/                   # 📊 API/DATA — 4 fichiers
│   ├── data_model.md              # Modèle de données (12 entités)
│   ├── api_contract.md            # Contrat API REST
│   ├── instrumentation_plan.md    # Plan analytics
│   └── kpi_definitions.md         # Définitions KPIs
│
├── 90_sources/                    # 📚 SOURCES — (vide)
│
└── README.md                      # 📋 CE FICHIER — Index actionnable
```

---

## 🔄 Consolidation des Redondances

### Fichiers en double (analyse)

| Fichier | 00_product/ | 20_simulation/ | Statut |
|---------|-------------|----------------|--------|
| `indices.md` | Vue métier (299L) | Spécification technique (1151L) | ✅ **Complémentaires** |
| `leviers_catalogue.md` | Catalogue produit (493L) | Implémentation technique (1684L) | ✅ **Complémentaires** |

> **Conclusion** : Ces fichiers ne sont **pas des duplications** mais des **vues différentes** :
> - `00_product/` = **Définition métier** (quoi et pourquoi) — pour Product Owner/Game Designer
> - `20_simulation/` = **Spécification technique** (comment implémenter) — pour Développeur/Simulation Engineer

### Règle de consolidation

> **Une information = un seul endroit détaillé.**  
> - Métier/Produit → `00_product/`  
> - Technique/Implémentation → `20_simulation/`  
> - Les documents techniques peuvent **référencer** les documents métier mais pas l'inverse.

---

## ⚠️ Documents Manquants

> Seul 1 dossier reste vide et nécessite une création future.

| Dossier | Documents attendus | Priorité | Rôle rédacteur |
|---------|-------------------|----------|----------------|
| `90_sources/` | Références externes, benchmarks, inspirations | Basse | Product Owner |

---

## 📝 Règles de Contribution

### Avant de créer un document

1. Vérifier s'il existe déjà dans l'arborescence
2. Identifier la **source of truth** du domaine (voir tableau ci-dessus)
3. Choisir le bon rôle (voir [`70_ai/roles_pack.md`](./70_ai/roles_pack.md))

### Lors de la rédaction

1. **Ne pas dupliquer** — Référencer plutôt que copier
2. **Marquer les zones floues** — Utiliser `[OPEN QUESTION]` avec 2 options + recommandation
3. **Taguer le hors scope** — `[OUT OF SCOPE MVP]` pour les fonctionnalités V1+
4. **Ajouter systématiquement** :
   - Section « Décisions »
   - Section « Risques & mitigations »
   - Section « Checklist de validation »

### Format

- Markdown clair, titres stables (pour ancres)
- Tableaux pour les listes structurées
- Exemples concrets (payloads, scénarios, pseudocode)

---

## 🔗 Liens Rapides

| Besoin | Lien direct |
|--------|-------------|
| Qu'est-ce qu'on construit ? | [`prd.md`](./00_product/prd.md) |
| Qu'est-ce qui est IN/OUT du MVP ? | [`scope.md`](./00_product/scope.md) |
| C'est quoi un terme ? | [`glossary.md`](./00_product/glossary.md) |
| Quelles sont les US à implémenter ? | [`backlog.md`](./00_product/backlog.md) |
| Comment fonctionne le moteur ? | [`overview.md`](./20_simulation/overview.md) |
| Quels sont les 7 indices ? | [`indices.md`](./20_simulation/indices.md) |
| Comment joue-t-on ? | [`gameplay_core.md`](./10_game_design/gameplay_core.md) |
| Quels rôles pour Antigravity ? | [`roles_pack.md`](./70_ai/roles_pack.md) |
| Quelle stack technique ? | [`stack.md`](./40_engineering/stack.md) |
| Comment sécuriser ? | [`auth_rbac.md`](./50_security_compliance/auth_rbac.md) |
