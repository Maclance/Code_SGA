# Backlog — AssurManager : Le Défi IARD (MVP → V2)

> Format : Epics → Features → User stories (US) avec **priorité** (P0/P1/P2), **release** (MVP/V1/V2), **taille** (S/M/L) et **critères d’acceptation** (AC).

---

## 0) Conventions

- **P0** = indispensable (bloque la valeur cœur)
- **P1** = important (augmente fortement la valeur, mais contournable)
- **P2** = nice-to-have (différenciation/qualité)
- **MVP** = solo + moteur + cockpit + admin de base + export
- **V1** = multijoueur + séminaire 200+ + admin avancé + produits supplémentaires
- **V2** = industrialisation, analytics avancés, scénarios riches, optimisation scale

---

## 1) Roadmap par releases

### MVP — « Jouer & apprendre en solo »
1. Foundations SaaS (tenant, RBAC, audit, stockage état)
2. Core loop (tour : lecture → événements → décisions → résolution → feedback)
3. Moteur (indices + P&L + multi-produits + effets retard + persistance)
4. UI cockpit (dashboard enrichi + décisions + marché + explainability + alertes)
5. Contenu (18 compagnies + Auto & MRH jouables + événements marché + 2 événements compagnie)
6. Debrief & export PDF simple
7. Admin session (vitesse, difficulté, produits 1+, catalogue événements baseline)
8. Instrumentation minimale (KPI produit + logs)

### V1 — « Multijoueur & séminaire 200+ »
1. Multijoueur (lobby, équipes, synchro, vote)
2. Mode séminaire (observateurs illimités, projection, outils facilitateur)
3. Admin avancé (pondérations, intensité événements, scénarios)
4. Produits PJ + GAV jouables
5. Leviers progressifs complets (Fraude N2/N3 etc.)
6. Debrief enrichi (équipe, distribution des choix)

### V2 — « Scale & différenciation »
1. IA concurrente plus stratégique (profils)
2. Analytics pédagogiques avancés (biais, progression)
3. Marketplace / bibliothèque de scénarios & événements
4. Branding tenant + exports avancés
5. Tests de charge & optimisation temps réel (séminaire massif)

---

# EPIC E0 — Foundations SaaS (MVP)

## E0.1 Multi-tenant, Auth, RBAC
**US-001** (P0, MVP, L) — Créer et gérer des **tenants** (entreprises/écoles)
- AC1 Given super admin, When création tenant, Then tenant_id unique + paramètres init
- AC2 Then toutes les données « tenant-scoped » sont isolées (filtrage strict)

**US-002** (P0, MVP, L) — Inviter des utilisateurs et attribuer un **rôle** (Admin tenant / Formateur / Joueur / Observateur)
- AC1 When invitation envoyée, Then lien activation + expiration
- AC2 Then RBAC empêche l’accès non autorisé aux écrans/actions

**US-003** (P0, MVP, M) — Authentification sécurisée (login/logout, reset)
- AC1 When login valide, Then session créée + expiration
- AC2 Then tentatives invalides journalisées

**US-004** (P0, MVP, M) — Journal d’audit (actions sensibles)
- AC1 When création/modif session, Then audit log « qui/quand/quoi »
- AC2 Then consultation audit par Admin tenant

## E0.2 Stockage & versioning des parties
**US-005** (P0, MVP, L) — Stocker l’état complet d’une partie par tour
- AC1 Then chaque tour persiste : décisions, événements, indices, P&L, métriques portefeuille
- AC2 Then reprise/relecture au tour N possible

**US-006** (P0, MVP, M) — Gestion version moteur (engine_version)
- AC1 Then chaque partie référence engine_version
- AC2 Then recalcul rétroactif interdit par défaut

---

# EPIC E1 — Sessions & Core Gameplay Loop (MVP)

## E1.1 Création/paramétrage session (côté admin)
**US-010** (P0, MVP, M) — Créer une session avec : vitesse, difficulté, durée, produits 1+, catalogue événements baseline
- AC1 Given session, When produits sélectionnés, Then UI/leviers se configurent en conséquence
- AC2 Then impossible de lancer sans au moins 1 produit

**US-011** (P0, MVP, M) — Générer un code/lien de session (rejoindre)
- AC1 When session créée, Then code unique + état « brouillon/prête/lancée/terminée »

## E1.2 Onboarding joueur et sélection
**US-012** (P0, MVP, M) — Rejoindre une session, choisir une compagnie parmi 18
- AC1 Then fiche compagnie (traits) visible avant confirmation
- AC2 Then sélection verrouillée au lancement

**US-013** (P0, MVP, M) — Confirmer le scope produits (affiché au joueur) avant tour 1
- AC1 Then le joueur voit les produits inclus (Auto/MRH…)

## E1.3 Boucle de tour
**US-014** (P0, MVP, L) — Tour : dashboard → événements → décisions → résolution → feedback
- AC1 When décision validée, Then calcul moteur + passage tour N+1
- AC2 Then feedback résume variations majeures

**US-015** (P1, V1, M) — Timer de tour (synchrone multijoueur)
- AC1 When timer expire, Then auto-submit selon règles (dernière décision ou défaut)

---

# EPIC E2 — Moteur de simulation (MVP → V2)

## E2.1 Indices & P&L
**US-020** (P0, MVP, L) — Calcul des 7 indices + P&L pédagogique
- Indices : IAC, IPQO, IERH, IRF, IMD, IS, IPP
- AC1 Then chaque levier impacte au moins un indice
- AC2 Then P&L inclut primes, sinistres, frais, réassurance (niveau macro)

## E2.2 Multi-produits (scope 1+)
**US-021** (P0, MVP, L) — Calculs par produit + agrégation compagnie
- AC1 Given Auto+MRH, When décision RH/IT, Then impact partagé (capacité/qualité)
- AC2 When tarif Auto change, Then métriques Auto évoluent sans écraser MRH

**US-022** (P0, MVP, M) — Ressources communes (budget, effectifs, IT/Data) “compétitionnent” entre produits
- AC1 Then l’allocation budget affiche consommation/solde et impacts

## E2.3 Effets retard & persistance
**US-023** (P0, MVP, L) — Effets retard paramétrés par vitesse
- RH : ~2 tours (trimestre), IT/Data : 3–6, prévention : 4–8, réputation : 1–3
- AC1 Then UI indique « effet différé attendu »

**US-024** (P0, MVP, L) — Persistance relative + compensation possible (coût croissant)
- AC1 Then la correction est possible mais plus chère si tardive
- AC2 Then historique des décisions accessible

## E2.4 Leviers progressifs
**US-025** (P0, MVP, M) — Fraude niveau 1 (quick wins)
- AC1 Then effet rapide mais plafonné

**US-026** (P1, V1, L) — Fraude niveaux 2 & 3 avec prérequis (outillage/data/formation)
- AC1 Then N2 nécessite budget+process/formation
- AC2 Then N3 nécessite maturité data + inertie + ROI différé

## E2.5 Concurrence / IA
**US-027** (P1, MVP, M) — Concurrents IA « simple » (réagit aux prix/parts)
- AC1 Then le marché évolue même sans action joueur

**US-028** (P2, V2, L) — IA concurrente « stratégique » (profils)
- AC1 Then profils (agressif/prudent/data-driven) sont différenciés

---

# EPIC E3 — Expérience Joueur & UI Cockpit (MVP)

## E3.1 Dashboard principal enrichi (cockpit)
**US-030** (P0, MVP, L) — Dashboard : indices + P&L + alertes + **batterie d’indicateurs** par produit + total
- Indicateurs MVP minimum :
  - Nb contrats (par produit + total)
  - Primes collectées (par produit + total)
  - Stock sinistres (par produit + total)
  - Effectif total + répartition macro (sinistres/distribution/data-IT/support)
- AC1 Then affichage « grille produits » + total
- AC2 Then niveau détail varie selon difficulté (novice macro, intermédiaire +)

**US-031** (P1, MVP, M) — Séries temporelles (indices & P&L)
- AC1 Then visualisation par tour (courbe)

## E3.2 Alertes & recommandations
**US-032** (P0, MVP, M) — Alertes (goulot RH, dérive stock sinistres, résilience faible, dette IT)
- AC1 When seuil franchi, Then alerte affiche cause probable + leviers conseillés

## E3.3 Écran événements
**US-033** (P0, MVP, M) — News flash + détails (impact + durée)
- AC1 Then l’événement indique « marché » ou « compagnie »

## E3.4 Écran décisions (leviers)
**US-034** (P0, MVP, L) — Décisions avec gating selon difficulté
- AC1 Novice : leviers macro
- AC2 Intermédiaire : leviers supplémentaires + granularité

**US-035** (P1, MVP, M) — Indication directionnelle d’impact (↑/↓ + délai)
- AC1 Then indique incertitude / retard (sans promesse de formule)

## E3.5 Vue marché
**US-036** (P0, MVP, M) — Parts de marché + prix moyens + tendances (par produit + global)
- AC1 Then tableau comparatif joueur vs marché

## E3.6 Explainability
**US-037** (P0, MVP, M) — « Pourquoi ça bouge ? » (top 3 drivers) pour variations majeures
- AC1 Then drivers = décisions / événements / effets retard

**US-038** (P1, V1, M) — Timeline de relecture tour par tour
- AC1 Then navigation rapide N→N+1 et filtres par produit

---

# EPIC E4 — Contenu : compagnies, produits, événements, scénarios

## E4.1 Compagnies jouables
**US-040** (P0, MVP, M) — 18 fiches compagnies + traits appliqués au moteur
- AC1 Then chaque compagnie a au moins 3 traits ayant un effet moteur

## E4.2 Produits
**US-041** (P0, MVP, L) — Produits jouables MVP : Auto + MRH
- AC1 Then métriques & leviers dédiés existent pour chaque produit

**US-042** (P1, V1, L) — Produits jouables V1 : PJ + GAV
- AC1 Then ajout sans casser Auto/MRH (design modulaire)

## E4.3 Catalogue d’événements (marché vs compagnie)
**US-043** (P0, MVP, L) — Événements « marché » : climat, inflation, réglementation, disrupteur, mutation parc auto
- AC1 Then s’appliquent à tous avec modulation par stratégie

**US-044** (P0, MVP, M) — Événements « compagnie » : au moins cyber/panne SI + 1 autre
- AC1 Then déclenchement influencé par vulnérabilités (ex IMD faible)

## E4.4 Scénarios
**US-045** (P1, V1, M) — Scénarios thématiques préconfigurés
- AC1 Then objectifs + pondérations scoring spécifiques

---

# EPIC E5 — Scoring, progression & Debrief (MVP → V1)

## E5.1 Scoring
**US-050** (P0, MVP, M) — Score global (pondération indices + objectifs)
- AC1 Then score final explicable (composants visibles)

**US-051** (P1, V1, S) — Pondérations variables selon mode (survie vs standard)
- AC1 Then mode survie valorise IRF + IPQO

## E5.2 Debrief & export
**US-052** (P0, MVP, M) — Debrief fin de partie : décisions clés + impacts immédiats/différés + biais
- AC1 Then liste « top 5 décisions déterminantes »

**US-053** (P0, MVP, M) — Export PDF simple
- AC1 Then PDF contient : contexte, courbes indices, P&L macro, top événements, score

**US-054** (P1, V1, M) — Debrief séminaire / équipes
- AC1 Then distribution des choix par équipe + comparaison

---

# EPIC E6 — Admin B2B (MVP → V2)

## E6.1 Gestion sessions & participants
**US-060** (P0, MVP, M) — Admin : gérer participants (import/invite) et rôles
- AC1 Then observateur n’a pas accès à la soumission de décisions

**US-061** (P1, V1, M) — Chef d’équipe (séminaire) : droits de consolidation
- AC1 Then un chef d’équipe peut valider la décision de l’équipe

## E6.2 Paramétrage contenu
**US-062** (P1, V1, L) — Paramétrer pondérations indices, intensité/fréquence événements, réglage réalisme
- AC1 Then warnings si réglage extrême

**US-063** (P2, V2, M) — Branding tenant
- AC1 Then logo/couleurs reflétés dans UI + exports

## E6.3 Suivi pédagogique
**US-064** (P0, MVP, M) — Vue admin : score, complétion, temps/tour, export
- AC1 Then filtre par session / produit / difficulté

---

# EPIC E7 — Données & instrumentation (MVP → V2)

## E7.1 Tracking minimal
**US-070** (P0, MVP, M) — Event tracking : session_start, turn_start/end, decision_submit, event_triggered, debrief_open, export_pdf
- AC1 Then chaque événement inclut tenant_id, session_id, user_id (si applicable)

**US-071** (P0, MVP, M) — Tableau KPI produit (admin)
- AC1 Then KPI : complétion, nb sessions/utilisateur, temps moyen/tour

## E7.2 Analytics pédagogiques
**US-072** (P2, V2, L) — KPI pédagogiques : progression par compétence + détection biais
- AC1 Then recommandations “prochaine partie” côté formateur

---

# EPIC E8 — Multijoueur & Séminaire 200+ (V1)

## E8.1 Lobby & équipes
**US-080** (P0, V1, L) — Lobby multijoueur : rejoindre, former équipes, ready-check
- AC1 Then aucune notion de plafond fonctionnel
- AC2 Then gouvernance via équipes & rôles

## E8.2 Décision collective & synchronisation
**US-081** (P0, V1, L) — Tour synchrone + décision par équipe (vote ou chef d’équipe)
- AC1 Then règles d’égalité définies

## E8.3 Observateurs illimités & projection
**US-082** (P0, V1, M) — Rôle Observateur (lecture seule) + mode projection
- AC1 Then UI projection est lisible sur grand écran

## E8.4 Outils facilitateur
**US-083** (P1, V1, M) — Pause, accélération, injection événement, commentaire
- AC1 Then actions facilitateur audit-loggées

## E8.5 Classements
**US-084** (P1, V1, M) — Classement live inter-équipes + moments clés
- AC1 Then historique des positions consultable

---

# EPIC E9 — Non-fonctionnel, sécurité, conformité, observabilité (MVP → V2)

## E9.1 RGPD & sécurité
**US-090** (P0, MVP, M) — RGPD : minimisation + export/suppression utilisateur
- AC1 Then suppression anonymise les traces non essentielles

**US-091** (P0, MVP, M) — Sécurité : RBAC strict + protections de base (rate limiting, brute force)
- AC1 Then tentatives suspectes journalisées

## E9.2 Observabilité
**US-092** (P0, MVP, M) — Logs techniques + métriques (latence calcul, erreurs)
- AC1 Then dashboard interne “santé moteur”

## E9.3 Scalabilité séminaire
**US-093** (P1, V1, L) — Optimisation temps réel (fan-out, cache, throttling)
- AC1 Then tests de charge validés pour 200+ participants/observateurs (objectif latence défini)

---

# EPIC E10 — Onboarding & adoption (MVP → V1)

**US-100** (P1, MVP, M) — Guide in-app (tooltips + checklist première partie)
- AC1 Then un novice comprend la boucle en < 5 min

**US-101** (P1, V1, M) — Kit facilitateur (script, timings, règles)
- AC1 Then exportable/printable

---

## 2) Backlog des leviers (décisions) — catalogue MVP

> Objectif : couvrir les leviers mentionnés (produit, distribution, marketing, RH, IT/Data, prestataires, sinistres/fraude, réassurance, prévention, provisions/placements) avec gating difficulté.

### Leviers Produit (par produit)
- L-PROD-01 (P0, MVP) Tarif (macro)
- L-PROD-02 (P0, MVP) Franchise (macro)
- L-PROD-03 (P1, V1) Segmentation tarifaire (expert)
- L-PROD-04 (P1, V1) Couverture/garanties avancées

### Distribution
- L-DIST-01 (P0, MVP) Mix canaux (macro)
- L-DIST-02 (P0, MVP) Commissions (macro)
- L-DIST-03 (P1, V1) Incentives avancés par canal

### Marketing
- L-MKT-01 (P0, MVP) Campagne marque vs activation
- L-MKT-02 (P1, V1) Ciblage (selon difficulté)

### RH
- L-RH-01 (P0, MVP) Recrutement par macro-pôle
- L-RH-02 (P0, MVP) Formation
- L-RH-03 (P1, V1) QVT / rémunération fine

### IT/Data
- L-IT-01 (P0, MVP) Invest SI (stabilité/sécurité)
- L-DATA-01 (P0, MVP) Qualité data/gouvernance (macro)
- L-AI-01 (P1, V1) Cas d’usage (triage/fraude) sous prérequis

### Prestataires/partenaires
- L-PART-01 (P0, MVP) Internaliser vs externaliser (macro)
- L-PART-02 (P1, V1) SLA/bonus-malus

### Sinistres & fraude
- L-SIN-01 (P0, MVP) Capacité sinistres (via RH)
- L-FRAUDE-01 (P0, MVP) Fraude N1
- L-FRAUDE-02 (P1, V1) Fraude N2
- L-FRAUDE-03 (P1, V1) Fraude N3

### Réassurance
- L-REASS-01 (P0, MVP) Niveau de protection (macro)
- L-REASS-02 (P1, V1) Types de traités (avancé)

### Prévention
- L-PREV-01 (P0, MVP) Prévention (macro, effet retard)
- L-PREV-02 (P1, V1) Prévention data-driven

### Provisions & placements
- L-PROV-01 (P0, MVP) Provisionnement prudent vs agressif
- L-INV-01 (P0, MVP) Allocation prudente vs risquée

---

## 3) Dépendances critiques (à surveiller)

- Multi-produits (E2.2) dépend du modèle de données (E0.2) + UI cockpit (E3.1)
- Explainability (E3.6) dépend de la traçabilité moteur (E2 + E7)
- Export PDF (E5.2) dépend de l’état de partie par tour (E0.2)
- Multijoueur (E8) dépend d’une architecture temps réel + permissions (E0/E9)

---

## 4) Définition de Done (MVP)

- Une session solo se joue jusqu’au bout sans crash.
- Les métriques cockpit (contrats/primes/sinistres/effectifs) sont cohérentes tour à tour.
- Les événements marché + au moins 2 événements compagnie déclenchent et sont visibles.
- Les effets retard (RH/IT/prévention/réputation) existent et sont perceptibles.
- Debrief final + export PDF fonctionnent.
- Logs + tracking minimal disponibles côté admin.

