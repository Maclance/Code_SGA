# roles_multijoueur.md — Rôles et Mécaniques Multijoueur

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25

---

## 1) Vue d'ensemble

Ce document spécifie les rôles utilisateurs et mécaniques multijoueur d'AssurManager.

> ⚠️ **Note MVP** : Le mode multijoueur est **[OUT OF SCOPE MVP]**. Seul le mode Solo est disponible. Ce document documente les rôles MVP (Admin/Formateur/Joueur) et prépare l'architecture pour V1.

### 1.1 Scope MVP vs V1+

| Élément | MVP | V1+ |
|---------|-----|-----|
| Modes | Solo uniquement | Multijoueur, Séminaire 200+ |
| Rôles actifs | Admin Tenant, Formateur, Joueur | + Observateur, Chef d'équipe |
| Équipes | Non applicable | Formation équipes, vote |
| Synchronisation | Non applicable | Tours synchronisés, timer |

---

## 2) Rôles Utilisateurs (MVP)

### 2.1 Super Admin (Éditeur)

| Attribut | Valeur |
|----------|--------|
| **Input** | Accès plateforme global |
| **Output** | Gestion tenants, configuration système |
| **Limites** | Ne participe pas aux sessions de jeu |
| **Feedback** | Console d'administration |

**Permissions MVP** :
- Créer/supprimer des tenants
- Gérer les versions moteur (engine_version)
- Accès aux logs et métriques globaux
- Configuration catalogue événements baseline

### 2.2 Admin Tenant

| Attribut | Valeur |
|----------|--------|
| **Input** | Contexte tenant (entreprise/école) |
| **Output** | Gestion utilisateurs et sessions du tenant |
| **Limites** | Scope limité à son tenant |
| **Feedback** | Dashboard admin tenant |

**Permissions MVP** :
- Inviter/gérer utilisateurs du tenant
- Attribuer rôles (Formateur, Joueur)
- Consulter journal d'audit
- Voir les KPIs agrégés des sessions

### 2.3 Formateur

| Attribut | Valeur |
|----------|--------|
| **Input** | Accès création et suivi de sessions |
| **Output** | Sessions paramétrées, debriefs, exports |
| **Limites** | Pas d'accès admin tenant |
| **Feedback** | Interface formateur (création session, suivi) |

**Permissions MVP** :
- Créer et paramétrer des sessions
- Gérer les participants d'une session
- Consulter les résultats et debriefs
- Exporter les rapports PDF
- Voir les KPIs de ses sessions
- Suivre les compétences acquises par les apprenants

**Accès pédagogique** :
- Voir le Score Performance + Score Apprentissage de chaque joueur
- Consulter les compétences acquises (étoiles) par apprenant
- Identifier les biais détectés pour chaque joueur
- Accéder aux recommandations de progression
- Exporter un rapport de groupe (agrégat compétences)

### 2.4 Joueur

| Attribut | Valeur |
|----------|--------|
| **Input** | Code/lien de session |
| **Output** | Participation au jeu, décisions |
| **Limites** | Accès uniquement aux sessions autorisées |
| **Feedback** | Interface de jeu (cockpit, décisions) |

**Permissions MVP** :
- Rejoindre une session via code/lien
- Choisir une compagnie
- Prendre des décisions chaque tour
- Consulter son debrief personnel
- Exporter son rapport PDF

**Dépendances simulation** : Stockage des décisions par tour, calcul du score personnel.

---

## 3) Rôles Multijoueur [OUT OF SCOPE MVP]

### 3.1 Observateur

> Prévu V1 — Mode séminaire 200+

| Attribut | Valeur |
|----------|--------|
| **Input** | Code session + rôle Observateur |
| **Output** | Vue lecture seule des dashboards |
| **Limites** | Pas de soumission de décisions |
| **Feedback** | Interface réduite (cockpit, marché) |

**Permissions prévues** :
- Voir le cockpit en temps réel
- Voir la vue marché
- Voir le classement
- Pas d'accès aux décisions des autres joueurs

### 3.2 Chef d'Équipe

> Prévu V1 — Mode séminaire avec équipes

| Attribut | Valeur |
|----------|--------|
| **Input** | Désignation par le formateur |
| **Output** | Consolidation des décisions d'équipe |
| **Limites** | 1 chef par équipe |
| **Feedback** | Interface de vote/consolidation |

**Permissions prévues** :
- Collecter les propositions de l'équipe
- Arbitrer en cas d'égalité
- Valider la décision finale de l'équipe
- Communiquer avec les membres

---

## 4) Mécaniques Multijoueur [OUT OF SCOPE MVP]

### 4.1 Formation d'Équipes

> Prévu V1

| Attribut | Valeur |
|----------|--------|
| **Input** | Liste des participants |
| **Output** | Équipes constituées (1..N) |
| **Limites** | Min 2, max configurable par équipe |
| **Feedback** | Affichage composition équipes |

**Mécanismes prévus** :
- Constitution manuelle (formateur)
- Constitution aléatoire
- Auto-inscription (optionnel)

### 4.2 Décision Collective

> Prévu V1

| Attribut | Valeur |
|----------|--------|
| **Input** | Propositions individuelles des membres |
| **Output** | Décision consolidée de l'équipe |
| **Limites** | 1 décision par tour par équipe |
| **Feedback** | Statut des propositions, résultat du vote |

**Modes de décision prévus** :
- Vote majoritaire
- Arbitrage chef d'équipe
- Consensus (tous d'accord)

### 4.3 Synchronisation des Tours

> Prévu V1

| Attribut | Valeur |
|----------|--------|
| **Input** | Timer configuré par le formateur |
| **Output** | Passage au tour suivant synchronisé |
| **Limites** | Décision auto-submit si timer expiré |
| **Feedback** | Countdown visible, alertes |

**Règles prévues** :
- Timer configurable (ex: 5, 10, 15 min/tour)
- Auto-submit : dernière décision validée ou défaut
- Alerte à 1 min, 30s, 10s

### 4.4 Outils Facilitateur

> Prévu V1

| Outil | Fonction |
|-------|----------|
| Pause | Suspendre le timer |
| Accélération | Réduire le timer restant |
| Injection événement | Déclencher un événement spécial |
| Commentaire | Afficher un message à tous |

---

## 5) Architecture Préparée (MVP)

Même si le multijoueur est hors scope MVP, l'architecture prépare V1 :

### 5.1 Modèle de Données

```
Session
├── session_id
├── tenant_id
├── status: draft | ready | running | finished
├── config: SessionConfig
└── participants[]
    ├── user_id
    ├── role: player | observer | team_leader [V1+]
    ├── company_id (si joueur)
    └── team_id [V1+]
```

### 5.2 États de Session

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐
│ DRAFT   │───▶│ READY   │───▶│ RUNNING │───▶│ FINISHED │
└─────────┘    └─────────┘    └─────────┘    └──────────┘
     │              │              │
  Création     Lancement      Dernier tour
  session     (participants   ou game over
              verrouillés)
```

### 5.3 RBAC (Role-Based Access Control)

| Action | Super Admin | Admin Tenant | Formateur | Joueur | Observateur |
|--------|:-----------:|:------------:|:---------:|:------:|:-----------:|
| Gérer tenants | ✓ | - | - | - | - |
| Gérer users tenant | ✓ | ✓ | - | - | - |
| Créer session | - | ✓ | ✓ | - | - |
| Rejoindre session | - | - | ✓* | ✓ | ✓ [V1+] |
| Soumettre décisions | - | - | - | ✓ | - |
| Voir debriefs | ✓ | ✓ | ✓ | ✓** | - |
| Exporter PDF | - | ✓ | ✓ | ✓** | - |

*Formateur peut rejoindre en mode observation
**Joueur voit uniquement son propre debrief

**Dépendances simulation** : Isolation des données par tenant, permissions vérifiées à chaque action.

---

## 6) Décisions / Risques / Checklist

### 6.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| RM-01 | Solo uniquement en MVP | Time-to-market, complexité multijoueur |
| RM-02 | 4 rôles MVP (Super Admin, Admin, Formateur, Joueur) | Couverture B2B minimale |
| RM-03 | Architecture multi prête dès MVP | Éviter refonte V1 |
| RM-04 | RBAC strict | Sécurité B2B |

### 6.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-13 | Attentes multijoueur non satisfaites | Communication claire scope MVP |
| R-14 | Architecture insuffisante pour V1 | Revue archi avant lancement MVP |
| R-15 | Permissions mal configurées | Tests RBAC exhaustifs |

### 6.3 Checklist MVP

- [ ] Implémentation RBAC 4 rôles
- [ ] Workflow invitation utilisateur
- [ ] Gestion sessions (CRUD)
- [ ] Journal d'audit actions sensibles
- [ ] Isolation données par tenant
- [ ] Préparation modèle données multi (team_id nullable)

### 6.4 Checklist V1 [OUT OF SCOPE MVP]

- [ ] Rôle Observateur
- [ ] Rôle Chef d'équipe
- [ ] Formation équipes
- [ ] Vote/consolidation décisions
- [ ] Timer synchronisation
- [ ] Outils facilitateur

---

## 7) Dépendances vers la Simulation

### 7.1 Pour le Mode Solo (MVP)

| Donnée | Source | Utilisation |
|--------|--------|-------------|
| user_id | Auth | Identification joueur |
| session_id | Session | Contexte de jeu |
| company_id | Choix joueur | État de jeu |
| decisions | Joueur | Stockage par tour |
| game_state | Moteur | État personnel |

### 7.2 Pour le Multijoueur [OUT OF SCOPE MVP]

| Donnée | Source | Utilisation prévue |
|--------|--------|-------------------|
| team_id | Configuration | Regroupement |
| team_decisions | Membres | Consolidation |
| sync_status | Timer | Synchronisation |
| global_ranking | Calcul | Classement |

---

*Scope MVP. [OUT OF SCOPE MVP] = V1/V2.*
