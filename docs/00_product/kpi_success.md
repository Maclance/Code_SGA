# kpi_success.md — AssurManager : Le Défi IARD

Objectif : définir un référentiel **strict** des KPI produit (activation, engagement, complétion, apprentissage, rétention, séminaire, conformité/enterprise) avec **formules**, **fenêtres temporelles**, et **règles de calcul**.

> Important : la comparabilité des résultats de jeu dépend des paramètres de session et de **engine_version** (cf. glossary). Les KPI “learning” et “score” doivent toujours être segmentés par ces dimensions.

---

## 1) Conventions de mesure (anti-ambiguïtés)

### 1.1 Timezone, fenêtres, granularité
- **Timezone analytique** : UTC (ou une timezone unique choisie) — à figer dans l’implémentation.
- **Fenêtre calendaire** :
  - **D0** = le jour de l’événement (activation, création session, etc.)
  - **D7** = 0–7 jours après D0 (inclusif côté jours, exclusif côté timestamp selon votre standard)
  - **D30** = 0–30 jours
- **Rolling windows** (recommandées) : trailing 7 jours (T7), trailing 28 jours (T28).
- Les KPI d’usage B2B se lisent souvent en **hebdomadaire** (WAU) et **mensuel** (MAU).

### 1.2 Identifiants & unités d’analyse
- **Tenant** : organisation cliente (unité business).
- **User** : compte authentifié.
- **Role** : Admin Tenant / Formateur / Joueur / Observateur / Chef d’équipe.
- **Session** : instance de partie paramétrée (vitesse, difficulté, durée, produits, scénario, pondérations).
- **Run** : exécution d’une session (session_id + start_time → end_time). Une session peut être relancée.
- **Participant** : user_id associé à un run avec un rôle (joueur/observateur…).
- **Tour** : unité de progression (selon vitesse).

### 1.3 Dimensions obligatoires de segmentation (jeu)
Pour tout KPI lié au gameplay (progression, score, temps/tour, complétion, learning) :
- **engine_version**
- **difficulty** (Novice / Intermédiaire / Expert / Survie)
- **speed** (Année / Trimestre / Mois)
- **products_scope** (Auto/MRH/PJ/GAV…)
- **scenario_id** (si scénarios)
- **mode** (Solo / Multijoueur / Séminaire)

> Règle : on ne compare pas des scores/indices entre sessions dont ces dimensions diffèrent.

### 1.4 Exclusions / hygiène analytique
- Exclure : comptes internes, tests, démos “seed”, trafic automatisé.
- Dédupliquer : 1 user = 1 unité (email) ; règles anti-multi-comptes si nécessaire.
- Traiter les abandons : distinguer “non démarré”, “démarré mais abandonné tôt”, “abandonné tard”.

---

## 2) Instrumentation minimale (événements) — base de calcul

### 2.1 Noms d’événements recommandés
> Chaque event contient : timestamp, tenant_id, user_id, role, session_id, run_id, engine_version, difficulty, speed, products_scope, scenario_id, mode.

**Onboarding & accès**
- `auth_sign_up` / `auth_invite_accepted`
- `auth_login_success`

**Admin / configuration**
- `tenant_created` (éditeur)
- `user_invited` / `user_role_changed`
- `session_template_created`

**Session / run**
- `session_created`
- `run_started`
- `participant_joined` (role, team_id)
- `turn_started` (turn_index)
- `decision_opened` (lever_count, budget)
- `decision_submitted` (lever_count, budget_allocated)
- `turn_resolved` (latency_ms)
- `debrief_viewed` (type: short/final)
- `export_pdf_clicked` / `export_pdf_succeeded`
- `run_completed` (reason: completed/timeout/abandoned/admin_stop)

**Séminaire**
- `vote_opened` / `vote_submitted` (si applicable)
- `team_decision_finalized`

**Qualité/tech**
- `error_shown` (error_code)
- `api_latency` (endpoint, p95 bucket)

### 2.2 Entités dérivées
- **Started Run** : au moins un `run_started`.
- **Active Participant** : `participant_joined` + au moins un event gameplay (`turn_started` ou `decision_submitted` ou `debrief_viewed`).
- **Active Turn** : `turn_started` suivi de `turn_resolved`.

---

## 3) North Star & piramide de métriques

### 3.1 North Star Metric (NSM)
**Apprentice Value Minutes (AVM)** — minutes de jeu **avec décision** + debrief

**AVM (par run)** = `sum(duration_of_turns_with_decision)` + `duration_debrief_viewed`
- Un tour compte dans AVM si le participant a soumis au moins une décision (`decision_submitted`) dans ce tour.

Pourquoi : reflète la valeur pédagogique (agir + comprendre) plutôt que “temps passif”.

### 3.2 Pyramide
- **Adoption/Activation** → **Engagement** → **Complétion** → **Apprentissage** → **Rétention**
- + **Enterprise readiness** (admin, conformité, qualité technique)

---

## 4) KPI d’adoption & activation

### 4.1 Activation (par persona)

#### A1 — Activation Formateur
**Définition** : un utilisateur rôle Formateur est “activé” s’il a **créé** et **démarré** au moins 1 run.

- **Activation Formateur D7** =
  - Numérateur : # formateurs avec ≥1 `run_started` dans les 7 jours suivant leur 1er login
  - Dénominateur : # formateurs ayant eu un `auth_login_success` (1er login) sur la période

#### A2 — Activation Joueur
**Définition** : un joueur est “activé” s’il a rejoint un run et soumis au moins 1 décision.

- **Activation Joueur D7** =
  - Numérateur : # joueurs avec ≥1 `decision_submitted` dans les 7 jours suivant `participant_joined`
  - Dénominateur : # joueurs avec `participant_joined` sur la période

#### A3 — Activation Admin tenant (gatekeeper)
**Définition** : un admin est “activé” s’il a configuré les rôles et créé un premier groupe/sess.

- **Activation Admin D14** =
  - Numérateur : # admins avec (`user_role_changed` ou `user_invited`) **ET** `session_created` dans les 14 jours
  - Dénominateur : # admins ayant eu un 1er login sur la période

### 4.2 Taux de première valeur (Time-to-First-Value)
- **TTFV Formateur** = median(`run_started_ts` − `first_login_ts`) par cohorte.
- **TTFV Joueur** = median(`first_decision_submitted_ts` − `participant_joined_ts`).

### 4.3 Activation tenant (B2B)
**Tenant Activated** : tenant qui a au moins 1 run démarré et ≥ X participants actifs.
- **Tenant Activation (T28)** = # tenants avec ≥1 `run_started` et ≥5 `active_participants` dans les 28 jours suivant `tenant_created` / contrat.

---

## 5) KPI d’engagement (usage)

### 5.1 Utilisateurs actifs
- **DAU** = # users distincts avec ≥1 event gameplay ou admin (hors login) sur le jour.
- **WAU** = # users distincts avec ≥1 event sur 7 jours glissants.
- **MAU** = # users distincts avec ≥1 event sur 28 jours glissants.

### 5.2 Engagement gameplay
- **Runs par utilisateur actif (T28)** = # runs démarrés / # utilisateurs actifs.
- **Tours joués par run** = avg(# `turn_resolved` par run).
- **Temps par tour** = median(`turn_resolved_ts` − `turn_started_ts`) (segmenté solo vs séminaire).
- **Decision Rate** =
  - Numérateur : # tours avec ≥1 `decision_submitted`
  - Dénominateur : # tours démarrés (`turn_started`)

### 5.3 Engagement séminaire
- **Participation Rate (séminaire)** =
  - Numérateur : # participants ayant soumis au moins 1 décision/vote
  - Dénominateur : # participants ayant rejoint le run
- **Time-to-Team-Decision** = median(`team_decision_finalized_ts` − `vote_opened_ts`) par tour.

---

## 6) KPI de complétion & progression

### 6.1 Complétion run
**Run Completed** : `run_completed(reason=completed)`.

- **Run Completion Rate** =
  - Numérateur : # runs complétés
  - Dénominateur : # runs démarrés

### 6.2 Complétion participant
**Participant Completed** : participant présent sur le run avec :
- soit `debrief_viewed(type=final)`
- soit ≥ 90% des tours résolus du run (si debrief non obligatoire)

- **Participant Completion Rate** = # participants complétés / # participants actifs

### 6.3 Abandon (churn intra-run)
- **Early Drop-off** = abandon avant le tour 2.
  - # participants dont dernier event gameplay survient avant `turn_index=2` / # participants actifs
- **Mid Drop-off** = abandon entre 20% et 80% des tours.
- **Late Drop-off** = abandon après 80% des tours.

### 6.4 “Rythme” (critique séminaire)
- **On-time Turn Rate** = % de tours finalisés sous un seuil (ex. 5 minutes).
  - Numérateur : # tours où (`turn_resolved_ts`−`turn_started_ts`) ≤ seuil
  - Dénominateur : # tours résolus

---

## 7) KPI d’apprentissage (learning outcomes)

> Rappel : toujours segmenter par engine_version + difficulty + speed + products_scope + scenario.

### 7.1 Learning Gain (entre sessions)
**Définition** : progression d’un joueur entre sa session 1 et sa session 2 dans un contexte comparable.

- **Cohorte comparable** : même (engine_version, difficulty, speed, products_scope, scenario_id, mode).

- **Learning Gain Score** = median( `score_run_2` − `score_run_1` ) sur la cohorte.
  - `score_run` = score global de partie (pondération indices) tel que défini par le moteur.

### 7.2 Stabilisation des arbitrages (moins de “coups de volant”)
- **Decision Volatility** (par levier) = avg( |lever_value_t − lever_value_(t−1)| ) sur le run.
- **Volatility Reduction** = median(volatility_run_2 − volatility_run_1) (attendu : négatif si apprentissage).

### 7.3 Réduction des biais (IS)
- **IS Mean** = moyenne de l’indice IS sur les tours du run.
- **IS Improvement** = median( IS_mean_run_2 − IS_mean_run_1 ) sur cohorte comparable.

### 7.4 Compréhension via explainability (proxy)
- **Debrief Consumption Rate** =
  - Numérateur : # participants ayant vu ≥ X secondes du debrief (ex. 60s)
  - Dénominateur : # participants actifs
- **Driver Click-through Rate** (si UI “top drivers”) = # clics drivers / # tours résolus.

### 7.5 Transfert au job (optionnel, V1+)
Si vous ajoutez un micro-questionnaire (2–3 items) post-session :
- **Self-Reported Transfer Intent** = % réponses ≥4/5.

---

## 8) KPI de rétention (retour)

### 8.1 Rétention joueurs
- **Player D7 Retention** =
  - Numérateur : # joueurs avec un event gameplay entre J+1 et J+7 après leur 1er run
  - Dénominateur : # joueurs ayant démarré un 1er run le jour J
- **Player D30 Retention** = analogue.

### 8.2 Rétention formateurs
- **Trainer Monthly Active Rate** = # formateurs actifs sur 28 jours / # formateurs totaux.
- **Sessions Created per Trainer (T28)**.

### 8.3 Rétention tenants (B2B)
- **Tenant WAU Rate** = # tenants avec ≥1 run dans les 7 derniers jours / # tenants actifs.
- **Renewal Proxy** : tenant avec ≥ N runs/mois sur 3 mois glissants.

---

## 9) KPI “enterprise-ready” (admin, conformité, contrôle)

### 9.1 Administration
- **Invite Acceptance Rate** = # `auth_invite_accepted` / # `user_invited`.
- **Role Hygiene** = % users avec rôle assigné (≠ null) / total users.
- **Audit Coverage** = % actions sensibles loggées / % actions sensibles totales.

### 9.2 RGPD / data governance (proxies)
- **PII Minimization** : # champs PII stockés par user (objectif : minimum viable).
- **Data Deletion SLA** : p95 temps de suppression (si feature).

### 9.3 Export (B2B)
- **Export Success Rate** = # `export_pdf_succeeded` / # `export_pdf_clicked`.
- **Export Usage** = # exports / # runs complétés.

---

## 10) KPI de qualité produit (fiabilité, performance, support)

### 10.1 Fiabilité
- **Crash-free Run Rate** = # runs sans `error_shown` de sévérité bloquante / # runs démarrés.
- **Blocking Error Rate** = # erreurs bloquantes / # runs.

### 10.2 Performance moteur
- **Turn Resolve Latency (p95)** = p95(latency_ms) sur `turn_resolved`.
- **API p95 (key endpoints)** = p95 latence par endpoint.

### 10.3 Support & incidents
- **Incident Rate** = # incidents / # runs (défini par votre process).
- **Time to Recover** = median(durée incident).

---

## 11) KPI de contenu & calibration (game design)

### 11.1 Santé du catalogue événements
- **Event Exposure** = # occurrences d’événements / run.
- **Event Diversity** = # types d’événements uniques / run.
- **Event Overload Rate** = % tours avec > K événements (seuil dépend vitesse) → indicateur de fatigue.

### 11.2 Calibration difficulté
- **Win Rate (par difficulté)** = % runs “score ≥ seuil” ou “objectifs atteints”.
- **Difficulty Fairness** = écart-type des scores (trop faible = jeu plat ; trop élevé = aléatoire).

### 11.3 Multi-produits
- **Cross-Product Impact Visibility** = % runs où au moins un événement/effet multi-produits est mentionné dans debrief (si instrumenté).

---

## 12) KPI par persona (lecture orientée décisions)

### P1 (Responsable pédagogique) / P3 (L&D)
- Tenant Activation (T28), Participant Completion Rate, Learning Gain Score, Export Success Rate, WAU/MAU.

### P2 (Formateur)
- TTFV Formateur, Run Completion Rate, On-time Turn Rate, Incident Rate, Debrief Consumption Rate.

### P5 (Admin IT/Secu)
- Activation Admin D14, Audit Coverage, Role Hygiene, Crash-free Run Rate.

### P6/P7 (Joueurs)
- Activation Joueur D7, Decision Rate, Participant Completion Rate, Learning Gain, IS Improvement.

### P8/P9 (Séminaire)
- Participation Rate, Time-to-Team-Decision, On-time Turn Rate, Projection/Observer satisfaction (si survey).

---

## 13) Garde-fous : pièges classiques & décisions de mesure

1) **Comparer des scores sans segmentation** (engine_version/difficulty/speed) = erreur.
2) **Compter du temps passif** (fenêtre ouverte) comme engagement = faux positif.
3) **Confondre run et participant** : un run séminaire peut avoir 200 participants — toutes les métriques doivent préciser l’unité.
4) **Ne pas tracer les paramètres de session** : rend l’analytics inutilisable.
5) **Métriques vanity** : “logins” sans décision/debrief = faible valeur.

---

## 14) Dictionnaire KPI (format standard)

Pour chaque KPI, conserver systématiquement ces champs :
- **Nom**
- **Intention** (pourquoi)
- **Définition stricte**
- **Formule**
- **Fenêtre** (D7/D30/T28…)
- **Unité** (user / participant / run / tenant)
- **Segments obligatoires**
- **Exclusions**
- **Owner** (PM / Data / L&D)

---

## 15) Annexes — exemples de seuils (à calibrer)

- Debrief Consumption Threshold : **≥ 60 secondes** (ou ≥ 30% du debrief).
- On-time Turn Threshold (séminaire) : **≤ 5 minutes** par tour (à ajuster selon vitesse et complexité).
- Tenant Activated : **≥ 1 run** + **≥ 5 participants actifs** sous 28 jours.

> Ces seuils doivent être validés par tests utilisateurs et observation de sessions réelles.

