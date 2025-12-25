# 📚 Documentation — AssurManager : Le Défi IARD

> **Index actionnable** de toute la documentation du projet.  
> Dernière mise à jour : 2025-12-25

---

## 📋 Table des Matières

- [Sources de Vérité](#-sources-de-vérité-source-of-truth)
- [Ordre de Lecture Recommandé pour Antigravity](#-ordre-de-lecture-recommandé-pour-antigravity)
- [Ce qui est Contractuel vs Références](#-ce-qui-est-contractuel-vs-références)
- [Arborescence Complète](#-arborescence-complète)
- [Documents Manquants](#-documents-manquants)
- [Règles de Contribution](#-règles-de-contribution)

---

## 🎯 Sources de Vérité (Source of Truth)

Chaque domaine a une **source unique** qui fait autorité. Les autres documents peuvent y faire référence mais ne doivent **jamais dupliquer** les définitions.

| Domaine | Source of Truth | Description |
|---------|-----------------|-------------|
| **Produit** | [`00_product/prd.md`](./00_product/prd.md) | Vision, objectifs, gameplay, fonctionnalités |
| **Scope & Limites** | [`00_product/scope.md`](./00_product/scope.md) | Périmètre MVP/V1/V2, hypothèses, hors scope |
| **Backlog** | [`00_product/backlog.md`](./00_product/backlog.md) | User stories, priorités P0/P1/P2, critères d'acceptation |
| **Vocabulaire Métier** | [`00_product/glossary.md`](./00_product/glossary.md) | Termes IARD + termes du jeu, définitions non ambiguës |
| **Simulation (Indices)** | [`00_product/indices.md`](./00_product/indices.md) | Définition des 7 indices, formules, invariants |
| **Simulation (Leviers)** | [`00_product/leviers_catalogue.md`](./00_product/leviers_catalogue.md) | Catalogue complet des décisions actionnables |
| **KPIs & Succès** | [`00_product/kpi_success.md`](./00_product/kpi_success.md) | Métriques produit, formules, conventions |
| **Personas** | [`00_product/personas.md`](./00_product/personas.md) | Utilisateurs cibles, jobs-to-be-done, besoins UX |
| **Game Design** | [`10_game_design/gameplay_core.md`](./10_game_design/gameplay_core.md) | Boucle de jeu, mécaniques fondamentales |
| **Aide IA** | [`70_ai/roles_pack.md`](./70_ai/roles_pack.md) | Rôles pour Antigravity, prompts, méthodes |

---

## 🚀 Ordre de Lecture Recommandé pour Antigravity

Pour une IA agent travaillant sur ce projet, voici la séquence de lecture optimale :

### Étape 1 : Contexte Produit (obligatoire)
1. **[`00_product/prd.md`](./00_product/prd.md)** — Vision complète du produit
2. **[`00_product/scope.md`](./00_product/scope.md)** — Ce qui est IN/OUT du MVP

### Étape 2 : Vocabulaire (obligatoire)
3. **[`00_product/glossary.md`](./00_product/glossary.md)** — Termes métier à maîtriser

### Étape 3 : Selon la tâche

| Type de tâche | Documents à lire |
|---------------|------------------|
| **Développement Simulation** | `indices.md` → `leviers_catalogue.md` → `backlog.md` |
| **Game Design / UX** | `gameplay_core.md` → `modes_difficultes.md` → `personas.md` |
| **Contenu Pédagogique** | `contenu_pedagogique.md` → `scoring_badges_debrief.md` |
| **Rôles & Permissions** | `roles_multijoueur.md` → `personas.md` |
| **KPIs / Analytics** | `kpi_success.md` → `backlog.md` (E7) |
| **Documentation** | `70_ai/roles_pack.md` → Ce README |

### Étape 4 : Prompts Antigravity
4. **[`70_ai/roles_pack.md`](./70_ai/roles_pack.md)** — Rôles et méthodes pour chaque type de tâche

---

## 📜 Ce qui est Contractuel vs Références

### ✅ Documents Contractuels (engagent le périmètre)

Ces documents définissent le **périmètre engagé**. Toute modification impacte le planning/budget.

| Document | Statut | Contenu engageant |
|----------|--------|-------------------|
| [`prd.md`](./00_product/prd.md) | 📌 Contractuel | Fonctionnalités MVP, modes de jeu, architecture produit |
| [`scope.md`](./00_product/scope.md) | 📌 Contractuel | Périmètre MVP précis, hypothèses, hors scope explicite |
| [`backlog.md`](./00_product/backlog.md) | 📌 Contractuel | User stories P0 (indispensables), critères d'acceptation |
| [`indices.md`](./00_product/indices.md) | 📌 Contractuel | Les 7 indices, leurs invariants (règles du moteur) |
| [`leviers_catalogue.md`](./00_product/leviers_catalogue.md) | 📌 Contractuel | Leviers MVP, disponibilité par difficulté, effets |

### 📖 Documents de Référence (explicatifs, évolutifs)

Ces documents **clarifient** et **guident** mais peuvent évoluer sans impact contractuel.

| Document | Statut | Contenu |
|----------|--------|---------|
| [`glossary.md`](./00_product/glossary.md) | 📖 Référence | Vocabulaire métier et jeu, conventions |
| [`personas.md`](./00_product/personas.md) | 📖 Référence | Profils utilisateurs, besoins UX |
| [`kpi_success.md`](./00_product/kpi_success.md) | 📖 Référence | Définitions KPI, formules de calcul |
| [`gameplay_core.md`](./10_game_design/gameplay_core.md) | 📖 Référence | Détail des mécaniques de jeu |
| [`modes_difficultes.md`](./10_game_design/modes_difficultes.md) | 📖 Référence | Paramètres par niveau de difficulté |
| [`scoring_badges_debrief.md`](./10_game_design/scoring_badges_debrief.md) | 📖 Référence | Système de scoring et badges |
| [`contenu_pedagogique.md`](./10_game_design/contenu_pedagogique.md) | 📖 Référence | Contenu éducatif, compagnies, événements |
| [`roles_multijoueur.md`](./10_game_design/roles_multijoueur.md) | 📖 Référence | Rôles utilisateurs, RBAC, préparation V1 |
| [`audit_alignement_pedagogique.md`](./10_game_design/audit_alignement_pedagogique.md) | 📖 Référence | Audit pédagogique, corrections proposées |
| [`roles_pack.md`](./70_ai/roles_pack.md) | 📖 Référence | Guide pour agents IA |

---

## 📂 Arborescence Complète

```
docs/
├── 00_product/                    # 🎯 PRODUIT — Source of Truth principale
│   ├── prd.md                     # PRD complet (487 lignes)
│   ├── scope.md                   # Scope MVP/V1/V2, hypothèses
│   ├── backlog.md                 # Backlog avec US et AC
│   ├── glossary.md                # Glossaire métier + jeu
│   ├── indices.md                 # Spécification des 7 indices
│   ├── leviers_catalogue.md       # Catalogue des leviers
│   ├── personas.md                # Personas utilisateurs
│   └── kpi_success.md             # KPIs et métriques
│
├── 10_game_design/                # 🎮 GAME DESIGN — Mécaniques de jeu
│   ├── gameplay_core.md           # Boucle de jeu, phases, multi-produits
│   ├── modes_difficultes.md       # Novice/Intermédiaire, vitesse, compagnies
│   ├── scoring_badges_debrief.md  # Scoring, badges, debrief
│   ├── contenu_pedagogique.md     # Compagnies, événements, tutoriel
│   ├── roles_multijoueur.md       # Rôles MVP et architecture V1
│   └── audit_alignement_pedagogique.md  # Audit pédagogique
│
├── 20_simulation/                 # 🔧 SIMULATION — (vide, à créer)
├── 30_ux_ui/                      # 🎨 UX/UI — (vide, à créer)
├── 40_engineering/                # ⚙️ ENGINEERING — (vide, à créer)
├── 50_security_compliance/        # 🔒 SÉCURITÉ — (vide, à créer)
├── 60_github/                     # 📦 GITHUB — (vide, à créer)
├── 70_ai/                         # 🤖 IA — Aide pour agents
│   └── roles_pack.md              # Pack de rôles Antigravity
├── 80_api_data/                   # 📊 API/DATA — (vide, à créer)
├── 90_sources/                    # 📚 SOURCES — (vide, à créer)
│
└── README.md                      # 📋 CE FICHIER — Index actionnable
```

---

## ⚠️ Documents Manquants

Les dossiers suivants sont **prévus** mais pas encore documentés :

### Priorité Haute (nécessaires avant implémentation)

| Dossier | Documents attendus | Rôle rédacteur |
|---------|-------------------|----------------|
| `20_simulation/` | `overview.md`, `formules.md`, `effets_retard.md`, `events_catalogue.md`, `test_vectors.json` | Simulation Engineer |
| `40_engineering/` | `stack.md`, `project_structure.md`, `env_setup.md`, `ci_cd.md`, `definition_of_done.md` | Lead Dev & Architecte |
| `50_security_compliance/` | `auth_rbac.md`, `multi_tenant_isolation.md`, `audit_log.md`, `rgpd.md` | Sécurité / Multi-tenant |

### Priorité Moyenne (nécessaires pour UX/développement)

| Dossier | Documents attendus | Rôle rédacteur |
|---------|-------------------|----------------|
| `30_ux_ui/` | `user_flows.md`, `screens_spec.md`, `design_system.md`, `accessibilite.md` | UX/UI Designer |
| `80_api_data/` | `data_model.md`, `api_spec.md`, `instrumentation_plan.md` | Database Engineer |

### Priorité Basse (utilité secondaire)

| Dossier | Documents attendus |
|---------|-------------------|
| `60_github/` | `branching_strategy.md`, `issue_templates/`, `pr_template.md` |
| `90_sources/` | Références externes, benchmarks, inspirations |

---

## 🔄 Consolidation des Redondances

### Redondances identifiées

| Information | Présente dans | Source of Truth | Action |
|-------------|--------------|-----------------|--------|
| Définition des 7 indices | `prd.md` (§8.2), `indices.md` (détaillé), `glossary.md` (court) | `indices.md` | ✅ OK — Niveaux de détail différents |
| Liste des leviers | `prd.md` (§7), `leviers_catalogue.md`, `backlog.md` (§2) | `leviers_catalogue.md` | ✅ OK — Backlog liste les US, catalogue détaille |
| Périmètre MVP | `prd.md` (§14), `scope.md` (§3) | `scope.md` | ⚠️ Vérifier cohérence |
| Objectifs pédagogiques | `prd.md` (§4.1), `contenu_pedagogique.md` (§1.1) | `contenu_pedagogique.md` | ✅ OK — PRD résume, GD détaille |

### Règle de consolidation

> **Une information = un seul endroit détaillé.**  
> Les autres documents peuvent **résumer** ou **référencer** mais jamais **dupliquer intégralement**.

---

## 📝 Règles de Contribution

### Avant de créer un document

1. Vérifier s'il existe déjà dans l'arborescence
2. Identifier la **source of truth** du domaine
3. Choisir le bon rôle (voir [`roles_pack.md`](./70_ai/roles_pack.md))

### Lors de la rédaction

1. **Ne pas dupliquer** — Référencer plutôt que copier
2. **Marquer les zones floues** — Utiliser `[OPEN QUESTION]` avec 2 options et une recommandation
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
| Comment fonctionne le moteur ? | [`indices.md`](./00_product/indices.md) + [`leviers_catalogue.md`](./00_product/leviers_catalogue.md) |
| Comment joue-t-on ? | [`gameplay_core.md`](./10_game_design/gameplay_core.md) |
| Quels rôles pour Antigravity ? | [`roles_pack.md`](./70_ai/roles_pack.md) |
