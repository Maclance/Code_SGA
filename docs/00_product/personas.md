# personas.md — AssurManager : Le Défi IARD

But : décrire les **personas clés** (école, entreprise, formateur, joueur, etc.) pour guider **UX**, **onboarding**, et plus tard **pricing/packaging**.

> Produit : SaaS B2B de simulation/serious game IARD (France), multi-tenant, sessions (solo/multi), rôle facilitateur, mode séminaire 200+.

---

## 1) Principes de segmentation

On segmente sur 2 axes :

1) **Contexte d’usage**
- **Éducation** (écoles/universités/organismes) : objectifs pédagogiques et évaluation.
- **Entreprise** (assureur, bancassureur, mutuelle, cabinet, prestataire) : acculturation, alignement inter-fonctions, transformation.

2) **Rôle dans l’expérience**
- **Acheteur / Sponsor** : paie, définit le succès, impose contraintes (sécurité, RGPD, reporting).
- **Administrateur** : configure tenant / utilisateurs / politiques.
- **Formateur / Facilitateur** : conçoit et anime les sessions.
- **Joueur** : prend des décisions en jeu (apprenant).
- **Observateur** : suit sans décider (séminaire).

---

## 2) Tableau rapide des personas (qui fait quoi)

| Persona | Contexte | Rôle produit | Décide / Paie | Utilise au quotidien | KPI de succès principal |
|---|---|---|---|---|---|
| P1 — Responsable pédagogique (école) | Éducation | Acheteur + sponsor | Oui (souvent) | Oui | Adoption cours + satisfaction + évaluations |
| P2 — Formateur / intervenant | Éducation / Entreprise | Facilitateur | Influence | Oui | Session fluide + debrief utile |
| P3 — L\&D / Formation corporate | Entreprise | Acheteur + sponsor | Oui | Oui | Engagement + progression + alignement inter-fonctions |
| P4 — Sponsor DG / COMEX | Entreprise | Sponsor | Oui (ou co-décide) | Parfois | Impact alignement + messages clés |
| P5 — Admin tenant / IT / Secu | Entreprise / Éducation | Admin | Gatekeeper | Oui | Conformité + sécurité + contrôle |
| P6 — Manager métier (joueur) | Entreprise | Joueur | Non | Oui | Compréhension + transfert au job |
| P7 — Fonction support (joueur) | Entreprise | Joueur | Non | Oui | Reconnaissance des contraintes + coopération |
| P8 — Observateur (séminaire) | Entreprise | Observateur | Non | Oui (événementiel) | Clarté + synthèse + compréhension |
| P9 — Chef d’équipe (séminaire) | Entreprise | Joueur + arbitre | Non | Oui (événementiel) | Décisions collectives rapides |

---

## 3) Personas détaillés

### P1 — « Camille » Responsable pédagogique (École / Université)

**Résumé** : pilote un programme (Master/DU/école d’assurance). Veut une expérience engageante, mesurable, simple à animer, et compatible avec des contraintes d’établissement.

- **Contexte** : promo 25–60 étudiants, cours en présentiel + distanciel, calendrier semestriel.
- **Objectifs**
  - Rendre la matière IARD **concrète** et systémique.
  - Évaluer des compétences (arbitrage, compréhension des risques, collaboration).
  - Standardiser une expérience répétable d’une année sur l’autre.
- **Jobs-to-be-done**
  - Créer des sessions avec un scénario adapté au cours.
  - Récupérer des outputs (scores, décisions clés, debrief) pour alimenter l’évaluation.
  - Justifier l’achat/renouvellement (ROI pédagogique, satisfaction).
- **Frustrations / risques**
  - Outil trop “jeu vidéo” sans cadre pédagogique.
  - Mise en place lourde (IT, comptes, support).
  - Résultats non comparables (paramètres non tracés, versions moteur).
- **Critères de succès**
  - ≥ 80% des étudiants complètent une session.
  - Debrief exploitable + export propre.
  - Setup < 30 min pour une classe.
- **Besoins UX / onboarding**
  - “Mode classe” : création session guidée, codes d’accès, gestion des groupes.
  - Modèles de sessions (templates) par module.
  - Exports et grilles d’évaluation.
- **Implications pricing (plus tard)**
  - Sensible à : prix/promo, licence annuelle, nombre de sièges.
  - Attente d’un pack “Education” (illimité ou large volume, paramétrage, reporting).

---

### P2 — « Romain » Formateur / intervenant (Éducation ou Corporate)

**Résumé** : animateur de sessions. Il vit et meurt par la fluidité de l’animation et la qualité du debrief.

- **Contexte** : animation 1h–3h ; parfois 200+ en séminaire ; matériel hétérogène.
- **Objectifs**
  - Démarrer vite (pas de friction).
  - Maintenir l’attention et la cadence.
  - Produire un debrief qui “clique” (causalité / impacts / effets retard).
- **Jobs-to-be-done**
  - Paramétrer difficulté/vitesse/produits/scénario.
  - Lancer, suivre la progression, relancer un groupe bloqué.
  - Exporter une synthèse (par équipe, par participant) + points pédagogiques.
- **Frustrations / risques**
  - Surabondance d’options (usine à gaz).
  - Pas de visibilité temps réel (où ça bloque ? qui ne joue pas ?).
  - Explainability insuffisante (le public ne comprend pas).
- **Critères de succès**
  - 0 incident bloquant en session.
  - Tour stable (rythme) + décisions prises dans les temps.
  - Debrief perçu utile (feedback positif > 4/5).
- **Besoins UX / onboarding**
  - “Assistant de création de session” (wizard) + presets.
  - Dashboard facilitateur (progression, taux de participation, alertes).
  - Mode projection + synthèse automatique.

---

### P3 — « Sarah » Responsable L&D / Formation (Entreprise IARD)

**Résumé** : acheteuse et propriétaire de l’impact formation. Cherche un produit B2B robuste (multi-tenant, sécurité) qui crée de l’engagement et sert la transformation.

- **Contexte** : population 50–5 000 apprenants/an, modules récurrents, séminaires, onboarding managers.
- **Objectifs**
  - Acculturer vite à l’IARD systémique (climat, inflation, réglementation, IA/data…)
  - Décloisonner (indemnisation, distribution, actuariat, finance, conformité, data/IT).
  - Avoir des métriques d’adoption/progression.
- **Jobs-to-be-done**
  - Déployer à l’échelle (sessions multiples, formateurs multiples).
  - Mesurer participation, complétion, progression (scores, biais).
  - Adapter le contenu (scénarios) au contexte de l’entreprise.
- **Frustrations / risques**
  - Produit non “enterprise-ready” (audit, RGPD, SSO, contrôle).
  - Reporting pauvre ou non actionnable.
  - Trop “générique” (pas aligné aux enjeux IARD France).
- **Critères de succès**
  - Adoption (sessions/utilisateur), rétention (retour), NPS formation.
  - Amélioration des scores/biais sur plusieurs cohortes.
  - Capacité à animer 200+ sans chaos.
- **Besoins UX / onboarding**
  - Admin tenant clair + gouvernance (rôles, groupes, politiques).
  - Bibliothèque de sessions + duplication.
  - Exports et dashboards (par cohorte, par équipe, par métier).
- **Implications pricing (plus tard)**
  - Attend packaging : licence entreprise (utilisateurs), options séminaire, reporting avancé.

---

### P4 — « Olivier » Sponsor DG / COMEX (Entreprise)

**Résumé** : paie ou arbitre. Il veut un outil qui soutient une narrative stratégique et produit des “moments” d’alignement.

- **Contexte** : séminaire, comité de direction élargi, transformation (climat, rentabilité, qualité, conformité).
- **Objectifs**
  - Alignement sur arbitrages (croissance vs rentabilité vs risques).
  - Déclencheur de conversations (pas juste un score).
  - Image moderne (outil engageant) + “learning by doing”.
- **Jobs-to-be-done**
  - Lancer un format événementiel crédible.
  - Obtenir une synthèse lisible (top décisions, biais, axes d’amélioration).
- **Frustrations / risques**
  - Outil qui “gamifie” trop et perd la crédibilité.
  - Trop complexe à expliquer en 10 minutes.
- **Critères de succès**
  - Debrief exploitable en COMEX.
  - Messages clés retenus (sondage post-séminaire).
- **Besoins UX**
  - Mode projection + storytelling événements.
  - Synthèse executive (1–2 pages) + KPI d’engagement.

---

### P5 — « Nadia » Admin tenant / IT / Sécurité (Gatekeeper)

**Résumé** : n’achète pas forcément, mais peut bloquer. Elle veut contrôle, traçabilité, et minimisation des risques.

- **Contexte** : DSI/SSI, contraintes RGPD, exigences audit, parfois SSO.
- **Objectifs**
  - Réduire risque (données, accès, logs).
  - Garder la maîtrise des droits et du cycle de vie des comptes.
- **Jobs-to-be-done**
  - Créer/maintenir groupes et rôles.
  - Gérer politiques (durées, exports, suppression).
  - Vérifier conformité (journal d’audit, isolation tenant).
- **Frustrations / risques**
  - Flou sur hébergement, logs, accès admin.
  - Droits trop permissifs, exports incontrôlés.
- **Critères de succès**
  - Traçabilité (audit) + séparation tenant + droits RBAC.
  - Setup simple (idéalement sans dépendances lourdes).
- **Besoins UX**
  - Console admin minimaliste, claire, “enterprise”.
  - Pages : rôles, logs, politiques, exports.

---

### P6 — « Malik » Manager Indemnisation / Partenariats (Joueur principal)

**Résumé** : cœur de cible. Veut comprendre les impacts systémiques de ses décisions et transférer ça au job.

- **Contexte** : manager opérationnel, temps limité, culture KPI, pression qualité/coûts.
- **Objectifs**
  - Voir les liens entre décisions (RH, réseau, fraude, IT) et performance.
  - Tester des stratégies sans risque réel.
  - Mieux dialoguer avec d’autres fonctions.
- **Jobs-to-be-done**
  - Jouer une session solo ou en équipe.
  - Comprendre « pourquoi ça bouge » (explainability).
  - Identifier 2–3 actions concrètes à appliquer en vrai.
- **Frustrations / risques**
  - Trop de chiffres sans lecture.
  - Interface trop dense, pas de priorités.
- **Critères de succès**
  - Compréhension des trade-offs (il peut les expliquer).
  - Debrief actionnable (takeaways).
- **Besoins UX / onboarding**
  - Tutoriel “premier tour” + glossaire intégré.
  - Alertes orientées décision (quoi faire maintenant).
  - Comparaison “avant/après” et drivers.

---

### P7 — « Léa » Fonction support (Actuariat / Finance / Conformité / Data-IT) — Joueur

**Résumé** : veut que les autres comprennent ses contraintes. Cherche un langage commun et des arbitrages crédibles.

- **Contexte** : expertise, parfois perçue comme “frein” (conformité) ou “support” (IT/data).
- **Objectifs**
  - Montrer les coûts/risques du court-termisme.
  - Faire comprendre effets retard (IT/data, provisions, solvabilité).
- **Jobs-to-be-done**
  - Jouer en mode expert (ou au moins intermédiaire).
  - S’appuyer sur les indices (IRF, IMD, IS) pour argumenter.
- **Frustrations / risques**
  - Modèle trop simpliste sur solvabilité/provisions.
  - “Gagner” en optimisant une variable, sans contrepartie.
- **Critères de succès**
  - Les non-experts intègrent les contraintes (feedback).
- **Besoins UX**
  - Info niveau expert disponible mais non imposée.
  - Explainability orientée causalité.

---

### P8 — « Julie » Observatrice (Séminaire 200+)

**Résumé** : elle suit, apprend, mais ne décide pas. Elle a besoin de clarté et de synthèse.

- **Contexte** : grand groupe, temps contraint, attention partagée.
- **Objectifs**
  - Comprendre la situation et la logique des décisions.
  - Suivre l’évolution des indices et du P&L.
- **Jobs-to-be-done**
  - Accéder au cockpit (lecture) + timeline événements.
  - Recevoir une synthèse post-session.
- **Frustrations / risques**
  - Trop d’informations non hiérarchisées.
  - Pas de “résumé” des décisions d’équipe.
- **Critères de succès**
  - Elle peut résumer l’histoire de la partie en 60 secondes.
- **Besoins UX**
  - Mode projection + mode lecture “light”.
  - Synthèse automatique de fin de tour.

---

### P9 — « Hugo » Chef d’équipe (Séminaire)

**Résumé** : arbitre et garde le rythme. Doit consolider contributions et décider vite.

- **Contexte** : équipe 4–12 personnes, parfois multi-métiers, timer.
- **Objectifs**
  - Transformer des opinions en décisions.
  - Tenir le temps et éviter les blocages.
- **Jobs-to-be-done**
  - Collecter propositions (ou votes) par levier.
  - Voir impacts attendus et risques.
  - Valider décision finale.
- **Frustrations / risques**
  - Interface qui ne permet pas de trancher.
  - Trop de discussions sans cadre.
- **Critères de succès**
  - Décision < X minutes/tour.
  - Participation équilibrée.
- **Besoins UX**
  - Vue “consolidation” (propositions, votes, recommandation, risques).
  - Indicateurs de participation.

---

## 4) Anti-personas (hors cible ou faible priorité)

### A1 — « Joueur gamer pur »
Cherche une profondeur ludique (méta, loot, progression longue, PVP). Risque : tirer le produit vers du jeu vidéo “pour joueurs”, au détriment du B2B pédagogique.

### A2 — « Utilisateur occasionnel sans temps »
Ne peut pas consacrer > 10 minutes. Peut consommer des extraits (vidéo/infographie) mais n’est pas la cible du serious game.

---

## 5) Implications UX transverses (décisions de design)

### 5.1 IA et complexité : progressive disclosure
- Novice : interface guidée, leviers macro, explications courtes.
- Intermédiaire : plus de leviers, comparaison drivers.
- Expert : détails disponibles (indices, contraintes) sans polluer les autres.

### 5.2 Deux modes UI à prévoir
- **Mode Joueur** : décider vite (priorités, alertes, impacts).
- **Mode Projection / Observateur** : comprendre vite (story + synthèse + graphs lisibles).

### 5.3 Onboarding par rôle
- Admin : check-list conformité + rôles + logs.
- Formateur : wizard session + presets + dry-run.
- Joueur : tutoriel 1er tour + glossaire contextualisé.

### 5.4 Comparabilité et crédibilité
- Toujours afficher : paramètres de session + engine_version.
- Exports : synthèse stable, lisible, reproductible.

---

## 6) Indicateurs de succès par persona (pour la recherche UX)

- P1/P3 (Acheteurs) : adoption (sessions), complétion, satisfaction, renouvellement, facilité d’admin.
- P2 (Formateur) : friction setup, incidents session, rythme/tour, qualité du debrief.
- P6/P7 (Joueurs) : compréhension (drivers), transfert au job, sentiment de contrôle, engagement.
- P8/P9 (Séminaire) : clarté projection, participation, temps de décision, synthèse.

---

## 7) Hypothèses à valider (plan de recherche)

- H1 : le **solo** suffit à vendre un MVP en B2B (avant multijoueur), si debrief + export sont solides.
- H2 : l’**explainability** (top drivers) est le facteur #1 de satisfaction joueur.
- H3 : les formateurs veulent des **presets** (scénarios) plus que des réglages fins au début.
- H4 : l’admin IT/secu exige une console claire (RBAC, audit, exports) pour éviter le blocage.
- H5 : en séminaire, la valeur vient du **rythme** + **synthèse**, pas de la profondeur d’options.

