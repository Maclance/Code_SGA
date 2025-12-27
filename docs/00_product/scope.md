# scope.md — AssurManager : Le Défi IARD

> Document de référence **anti-dérive** : hypothèses clés, limites, arbitrages, et **hors scope**.
>
> **Source of truth** : PRD + Backlog (P0/P1) ; ce scope précise les interprétations et décisions de cadrage.

---

## 1) Objectif du document

- Fixer le périmètre **MVP** (ce qu’on livre *vraiment*) et la trajectoire **V1/V2** (ce qu’on *décale*).
- Rendre explicites les **hypothèses** (ce qu’on suppose vrai pour avancer).
- Acter les **limites** (ce qu’on ne modélise pas / pas maintenant).
- Formaliser les **arbitrages** (valeur vs coût vs risque vs time-to-market).
- Lister sans ambiguïté le **non-scope**.

---

## 2) Définition du produit (ce qu’on construit)

**AssurManager** est un SaaS B2B de simulation/serious game qui met l’utilisateur à la tête d’une compagnie d’assurance IARD sur un marché français (18 acteurs), avec une boucle par tours : **cockpit → événements → décisions → résolution → feedback/debrief**.

Valeur cœur : **acculturer** et **entraîner** aux arbitrages (croissance, P\&L, qualité opérationnelle, résilience financière, contraintes réglementaires) via un modèle **pédagogique, cohérent et explicable**.

---

## 3) Périmètre par release

### 3.1 MVP — « Jouer & apprendre en solo » (scope contractuel)

**A. Foundations SaaS (B2B minimal, non négociable)**
- Multi-tenant (isolation stricte tenant-scoped)
- Auth (login/logout/reset) + RBAC (Admin tenant / Formateur / Joueur / Observateur)
- Journal d’audit sur actions sensibles
- Stockage de l’état de partie **par tour** (rejouabilité/relecture)
- Versioning moteur (engine_version)

**B. Gameplay cœur (solo)**
- Création session (vitesse, difficulté, durée, produits 1+, catalogue événements baseline)
- Rejoindre session + choisir une compagnie (parmi 18)
- Boucle de tour complète : dashboard → événements → décisions → résolution → feedback

**C. Moteur de simulation (pédagogique, stable)**
- 7 indices principaux (IAC, IPQO, IERH, IRF, IMD, IS, IPP) + P\&L macro
- 13 indices secondaires calculés (UND_STRICTNESS, ADVERSE_SEL_RISK, OPS_SURGE_CAP, BACKLOG_DAYS, REP_TEMP, REG_HEAT, COMPLAINTS_RATE, LITIGATION_RISK, CTRL_MATURITY, FRAUD_PROC_ROB, CHAN_QUALITY, DISTRIB_CONC_RISK, LEGAL_COST_RATIO) : **calculés dès MVP**, affichage selon difficulté (Expert = tous)
- Multi-produits **supporté dès MVP**, avec **Auto + MRH jouables** (calculs dédiés + agrégation)
- Ressources communes (budget, effectifs, IT/Data) qui « compétitionnent » entre produits
- Effets retard (RH/IT/Prévention/Réputation) paramétrés par vitesse
- Leviers progressifs : Fraude **N1** en MVP (N2/N3 en V1)
- **[MVP]** Levier Posture de Souscription (LEV-UND-01) — impact sur volume et qualité portefeuille
- **[MVP]** Levier Politique d'Indemnisation (LEV-CLI-01) — arbitrage coût/satisfaction
- **[V1]** Leviers Gestion de Crise (LEV-CRISE-01 Plan de crise) — résilience opérationnelle CatNat
- **[V1]** Leviers Conformité (LEV-CONF-02/03 Contrôle interne, Audit délégataires) — gouvernance et risque régulateur
- **[V1]** Leviers Qualité Distribution (Exigences canal, Concentration apporteurs) — qualité portefeuille par canal
- Concurrence IA **simple** (réagit prix/parts) pour dynamiser le marché

**D. UI Cockpit (lisible, actionnable)**
- Dashboard : indices + P\&L + alertes + indicateurs minimum (contrats, primes, stock sinistres, effectifs) **par produit + total**
- Écran événements (news flash + impact + durée)
- Écran décisions : gating selon difficulté (Novice vs Intermédiaire)
- Vue marché : parts de marché + prix moyens + tendances (par produit + global)
- Explainability MVP : « Pourquoi ça bouge ? » = top 3 drivers (décisions/événements/effets retard)

**E. Contenu MVP**
- 18 fiches compagnies + traits simples appliqués au moteur
- Catalogue événements : marché (climat, inflation, réglementation, disrupteur, mutation parc auto) + au moins 2 événements « compagnie » (cyber/panne SI)

**F. Debrief & export**
- Debrief fin de partie : décisions clés + impacts immédiats/différés + biais (niveau pédagogique)
- Export PDF simple (courbes indices + P\&L macro + top événements + score)

**G. Instrumentation minimale**
- Event tracking (session/turn/decision/event/debrief/export)
- Tableau KPI produit côté admin (complétion, sessions/utilisateur, temps moyen/tour)
- Logs techniques (latence calcul, erreurs)

---

### 3.2 V1 — « Multijoueur & Séminaire 200+ » (délibérément différé)

- Multijoueur : lobby, équipes, synchro des tours, vote ou chef d’équipe, timer
- Mode séminaire : observateurs illimités, mode projection, outils facilitateur (pause/injection événement/commentaire)
- Admin avancé : pondérations, intensité/fréquence événements, scénarios thématiques
- Produits additionnels jouables : PJ + GAV
- Leviers progressifs complets : Fraude N2/N3, cas d’usage IA sous prérequis
- Debrief enrichi : comparatif inter-équipes, distribution des choix
- Scalabilité : tests de charge 200+ (objectif latence défini)

---

### 3.3 V2 — « Scale & différenciation »

- IA concurrente stratégique (profils)
- Analytics pédagogiques avancés (progression, détection de biais)
- Marketplace / bibliothèque de scénarios et événements
- Branding tenant + exports avancés
- Optimisations temps réel (séminaire massif)

---

## 4) Hypothèses clés (on avance parce qu’on suppose que…)

### 4.1 Hypothèses produit / usage
- Le MVP doit être **vendable en B2B** même en solo (valeur : acculturation + débrief + export) avant d’investir dans le multijoueur.
- Les utilisateurs acceptent un modèle **pédagogique** (cohérent, explicable) plutôt qu’un modèle actuariel exact.
- Le multi-produits est une **différenciation**, mais l’explosion combinatoire est maîtrisée en MVP via un scope contenu limité (Auto/MRH).
- Le besoin « séminaire 200+ » est une exigence produit **réelle**, mais la livraison se fera en V1 (pas MVP).

### 4.2 Hypothèses de modélisation
- Les 7 indices + un P\&L macro suffisent pour créer des arbitrages crédibles.
- Les effets retard (latence) sont indispensables et peuvent rester **paramétrés** sans complexité excessive.
- Les leviers peuvent rester **macro** en novice/intermédiaire, avec montée de granularité progressive.

### 4.3 Hypothèses techniques / architecture
- Stocker l’état de partie par tour (snapshot + événements + décisions) est faisable et supporte export/debrief.
- La version du moteur (engine_version) est gérable dès MVP, même avec un modèle qui évolue.
- Le temps de calcul d’un tour doit rester stable et « temps réel » pour l’UX (ordre de grandeur : < 1–2 s côté serveur / fonction).

---

## 5) Limites (volontaires) du MVP

### 5.1 Limites de réalisme
- Pas de modélisation actuarielle exhaustive (pas de triangles, pas de granularité par garanties, pas de segmentation fine).
- Pas de reproduction fidèle de comptes réels / données assureur.
- P\&L « pédagogique » : cohérence relative tour à tour, pas une vérité financière.

### 5.2 Limites de contenu
- Produits : Auto + MRH **seuls pleinement jouables** (PJ/GAV en V1).
- Catalogue événements : volume limité (baseline) ; pas de scénarios riches ni de bibliothèque.

### 5.3 Limites d’UX / fonctionnalités
- Pas de multijoueur ni d’outils facilitateur en MVP.
- Explainability MVP limitée (top 3 drivers), pas de timeline avancée.
- Pas de personnalisation branding tenant.

### 5.4 Limites d’intégration
- Pas de connecteurs SI (S2P/ERP/CRM) en MVP.
- Pas d’import/export complexe (hors PDF simple + exports admin basiques).

---

## 6) Arbitrages clés (décisions explicites)

### 6.1 Multi-produits : valeur élevée, complexité maîtrisée
**Décision** : supporter 1+ produits dès MVP, mais rendre *jouables* uniquement Auto + MRH.
- Gain : crédibilité + différenciation + apprentissage transversal.
- Coût/risque : explosion combinatoire.
- Mitigation : architecture modulaire + ressources communes + indicateurs minimum.

### 6.2 Séminaire 200+ : exigence produit, livraison V1
**Décision** : pas de plafond fonctionnel « hard-coded », mais MVP reste solo.
- Gain : time-to-market.
- Risque : attentes « grand groupe ».
- Mitigation : cadrage contractuel V1 + architecture prête (roles, sessions, état tour, instrumentation).

### 6.3 Explainability : « suffisamment explicable » avant « parfaitement explicable »
**Décision** : top 3 drivers en MVP ; timeline & analyse approfondie en V1.
- Gain : déblocage pédagogique sans surcoût majeur.
- Risque : incompréhension utilisateur.
- Mitigation : alertes + feedback courts + debrief final structuré.

### 6.4 IA concurrente : simple en MVP
**Décision** : IA réactive (prix/parts) en MVP ; IA stratégique (profils) en V2.
- Gain : dynamisme du marché sans lourdeur.

### 6.5 Conformité/sécurité : baseline dès MVP
**Décision** : multi-tenant + RBAC + audit + RGPD minimisation dès MVP.
- Gain : vendabilité B2B.
- Coût : charge initiale.
- Justification : non négociable en environnement réglementé.

---

## 7) Hors scope (explicite)

### 7.1 Hors scope MVP (déféré)
- Multijoueur (lobby, équipes, synchronisation, vote, timer)
- Mode séminaire (observateurs illimités, projection, outils facilitateur)
- Produits PJ, GAV (et tout produit au-delà de Auto/MRH)
- Scénarios thématiques riches + bibliothèque/marketplace de contenu
- Branding tenant (logo/couleurs) et exports avancés
- Analytics pédagogiques avancés (progression, détection de biais, recommandations)
- IA concurrente stratégique (profils, comportements différenciés)
- Tests de charge 200+ (objectif latence contractuel)

### 7.2 Hors scope global (même V1/V2 sauf décision contraire)
- Connexion à des SI assureur réels (ERP/S2P/CRM) ou ingestion de données clients sensibles
- Modèle actuariel complet / tarification réelle / simulateur « vrai monde »
- Certification réglementaire, conformité exhaustive type outil de décision opérationnelle
- Personnalisation client « sur-mesure » de modèles (au-delà des paramètres et du contenu prévu)
- Gestion RH/finance au niveau micro (contrats, conventions, détail comptable)

---

## 8) Critères de succès MVP (niveau scope)

Le MVP est considéré « dans le scope » et réussit si :
- Une session solo se joue jusqu’au bout sans crash.
- Les métriques cockpit (contrats/primes/sinistres/effectifs) restent cohérentes tour à tour.
- Les événements marché + ≥2 événements compagnie se déclenchent et s’expliquent.
- Les effets retard (RH/IT/prévention/réputation) existent et sont perceptibles.
- Le debrief final + export PDF fonctionnent.
- La sécurité B2B minimale est en place (tenant isolation, RBAC, audit, RGPD minimisation).

---

## 9) Gestion des changements (anti-scope creep)

Toute demande est classée dans l’un de ces bacs :
- **Dans MVP** : aligne PRD + backlog P0/P1 et ne casse pas les arbitrages.
- **Parking V1** : nécessaire pour « séminaire/multi » ou extension contenu.
- **Parking V2** : différenciation/industrialisation.
- **Hors scope** : intégrations SI, modèle actuariel complet, personnalisation extrême.

Règles :
- 1 demande = 1 ticket = 1 PR.
- Toute extension du modèle (indice/produit/levier) exige : impact sur data model, UI, calibration, tests.

---

## 10) Notes d’interprétation (pour éviter les malentendus)

- « Pas de plafond participants » = pas de limite **fonctionnelle** codée. Les limites resteront **techniques** (infra, SLA) et **contractuelles**.
- « P\&L pédagogique » = cohérent pour apprendre, pas un outil de pilotage réel.
- « Multi-produits dès MVP » = support structurel + UI + moteur, mais **contenu jouable limité**.

