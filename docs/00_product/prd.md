# PRD — AssurManager : Le Défi IARD

## 1) Résumé exécutif

AssurManager est une plateforme SaaS B2B de simulation/serious game qui place l’apprenant à la tête d’une compagnie d’assurance IARD opérant sur un marché français concurrentiel. Le produit vise à sensibiliser et former des publics métiers (Direction, Partenariats, Indemnisation, Actuariat, Distribution, Conformité, Finance, Data/IT) aux arbitrages entre croissance, rentabilité, qualité opérationnelle, résilience financière et contraintes réglementaires.

Le jeu combine :

- **Civ-like** : choix d’un acteur parmi 18 compagnies dans un marché fermé, progression sur plusieurs tours, dynamiques concurrentielles.
- **Tower defense** : vagues de menaces externes (climat, inflation, réglementation, cyber, disrupteurs) à contrer via des “défenses” (réassurance, prévention, RH, IT/data, sinistres/fraude, underwriting, etc.).

**Nouveaux points structurants intégrés**

- **Portefeuille multi-produits** : chaque partie est jouée sur **1 ou plusieurs produits** (ex : Auto, MRH, Protection Juridique, Garantie des Accidents de la Vie, etc.), avec indicateurs et leviers **par produit** et arbitrages **transverses**.
- **Multijoueur “séminaire-ready”** : suppression de toute notion de nombre maximal de participants dans le produit ; le mode multijoueur doit pouvoir fonctionner en format événementiel **200+ personnes** via mécanismes d’équipes et d’observateurs.
- **Cockpit enrichi** : dashboard principal complété par une batterie d’indicateurs de pilotage (contrats/primes/sinistres/effectifs…) notamment **par produit**.
- **Difficulté = complexité actionnable** : le nombre et la granularité des leviers augmentent avec le niveau de difficulté.
- **Persistance et progression des leviers** : décisions à effets persistants (avec inertie/atténuation) ; certains leviers sont **progressifs par niveaux** (ex : fraude N1/N2/N3).
- **Événements externes typés** : événements **spécifiques à une compagnie** (idiosyncratiques, ex : cyberattaque) vs événements **marché** (systémiques, ex : épisode climatique).

---

## 2) Contexte & problématique

### 2.1 Contexte sectoriel

Le secteur IARD est en transformation structurelle :

- Changement climatique : fréquence/sévérité accrues des événements.
- Électrification du parc : mutation des coûts de réparation, pièces, main d’œuvre, sinistres.
- Émergence de l’IA & de la data : nouveaux leviers (fraude, automatisation, tarification) mais aussi nouveaux risques.
- Événements externes : inflation, volatilité économique, contraintes réglementaires et prudentielles.
- Activités complexes et silotées : produit, distribution, indemnisation, finance, conformité, data/IT, RH.

### 2.2 Besoin utilisateur

Les organisations doivent former rapidement des équipes (et managers) à :

- Comprendre les interactions systémiques (effets retard, externalités, arbitrages).
- Identifier les leviers de performance économique, opérationnelle et de croissance.
- Prendre de meilleures décisions sous contraintes (budget, effectifs, régulateur, marché), **y compris en arbitrant entre plusieurs produits**.

---

## 3) Cibles, utilisateurs & cas d’usage

### 3.1 Personae principales

- Manager métier (Indemnisation / Distribution / Partenariats) : veut comprendre comment ses décisions influencent l’entreprise.
- Dirigeant / Top management (DG, DGA, Comex) : veut un support pédagogique pour acculturer à la stratégie et aux risques.
- Fonctions support (Finance, Actuariat, Conformité, Data/IT, RH) : veut illustrer l’effet systémique de leurs politiques.
- Organismes de formation / écoles : souhaitent un outil engageant, paramétrable, avec reporting pédagogique.

### 3.2 Cas d’usage

- Formation initiale / onboarding (nouveaux managers, nouveaux métiers).
- Formation continue (modules thématiques : réassurance, sinistres, distribution, data, RH, conformité).
- Séminaires (mode multi-joueurs) : alignement inter-fonctions, prise de décision collective.
- Évaluation (debrief & score) : mesurer la progression et les biais de pilotage.

**Cas d’usage renforcé : “séminaire 200+”**

- Un facilitateur lance une session ; les participants se répartissent en **équipes** (ou rôles) ; certains sont **décideurs**, d’autres **observateurs**.
- Le produit ne fixe pas de plafond de participants ; l’encadrement se fait par **rôles, droits, et paramètres de session**.

---

## 4) Objectifs produit

### 4.1 Objectifs pédagogiques (learning outcomes)

À l’issue d’une session, l’apprenant doit mieux savoir :

- Arbitrer croissance vs rentabilité (sélection des risques, prix, garanties) **par produit** et au niveau compagnie.
- Gérer la chaîne sinistres (capacité, qualité, coûts, fraude, recours) et ses effets sur la satisfaction.
- Renforcer la résilience (réassurance, fonds propres, provisions, placements).
- Anticiper RH/IT/Data (inertie, dette technique, ROI différé).
- Intégrer la conformité comme contrainte structurante (et non un “frein”).

### 4.2 Objectifs business

- Produire un produit SaaS vendable en B2B : multi-tenant, administration, contenu paramétrable, analytics.
- Augmenter l’engagement et la rétention des apprenants (sessions récurrentes, progression, modes de difficulté).
- Supporter des usages “événementiels” (séminaire/formation de masse) sans refonte produit.

---

## 5) Principes & contraintes

- Rigueur sans lourdeur : modèles compréhensibles, explicables, et suffisamment réalistes.
- Systémique + effets retard : décisions qui payent (ou coûtent) plus tard.
- Transparence pédagogique : expliquer les causalités (ou au moins les hypothèses) au débrief.
- Paramétrabilité B2B : adapter les scénarios, niveaux, vitesses, réglages de marché.
- Environnements réglementés : traçabilité, sécurité, conformité (RGPD, etc.).
- **Équilibre multi-produits** : les produits ont des dynamiques propres (acquisition, sinistralité, coûts) et des contraintes partagées (capital, effectifs, SI, réputation).

---

## 6) Gameplay & expérience

### 6.1 Pitch de jeu

« Vous dirigez une compagnie IARD dans un marché en turbulence. Chaque tour, vous devez tenir la barre : prix, offres, réseau, sinistres, RH, IT, finance… tout en encaissant les chocs externes. Vous pilotez **un portefeuille de 1+ produits** et arbitrez entre performances locales (par produit) et performance globale. »

### 6.2 Portefeuille produits de la partie (nouveau)

Chaque session définit le **scope produits** :

- Sélection de **1 ou plusieurs produits** (exemples : Auto, MRH, PJ, GAV…).
- Pour chaque produit sélectionné :
  - Portefeuille (contrats, primes, résiliation, acquisition, composition).
  - Sinistralité (fréquence/sévérité, stock, délais, fraude, recours) et coûts.
  - Leviers (tarif/garanties/franchises, distribution, underwriting, prévention, etc.) **selon la difficulté**.

Règle de design :

- Les décisions “compétitionnent” pour des ressources **communes** (budget, effectifs, IT/Data, réassurance/capital).
- Des effets de second ordre existent : ex. surcharge sinistres Auto détériore la qualité globale et peut impacter la rétention MRH.

### 6.3 Styles de jeu

- Civ-like : marché à 18 acteurs, dynamique concurrentielle, parts de marché, positionnement.
- Tower defense : “vagues” d’événements (climat, inflation, cyber, réglementation, disrupteur) ; le joueur construit des défenses via ses leviers.

### 6.4 Modes

- **Solo** : joueur vs IA.
- **Multijoueur** : session synchrone, décision individuelle ou par équipe.
- **Séminaire (grand groupe)** : participants illimités au niveau produit (rôles : décideurs, contributeurs, observateurs). La gouvernance se fait via :
  - équipes (1..N),
  - droits (vote / proposition / observation),
  - rythme de tour (timer),
  - mécanismes de consolidation (vote, arbitrage chef d’équipe).

> Note produit : aucune notion de plafond “hard-coded”. Les limites éventuelles sont techniques et contractuelles (SLA), pas fonctionnelles.

### 6.5 Difficultés

- **Novice** : événements moins violents, explications guidées, modèles plus indulgents, **leviers macro**.
- **Intermédiaire** : modèles complets, concurrence plus agressive, **plus de leviers**.
- **Expert** : contraintes prudentielles plus strictes, effets retard renforcés, IA concurrente plus stratégique, **leviers avancés/finement paramétrés**.
- **Mode survie** : vagues d’événements rapprochées + budget contraint + pénalités accrues (objectif : survivre X tours).

**Principe : la difficulté gouverne la “surface de décision”**

- Plus la difficulté est élevée :
  - plus le nombre de leviers disponibles augmente,
  - plus leur granularité augmente,
  - plus les interactions/effets retard sont marqués,
  - plus l’explainability devient nécessaire.

### 6.6 Vitesse de jeu (période d’un tour)

- Rapide : 1 tour = 1 année.
- Moyenne : 1 tour = 1 trimestre.
- Lente : 1 tour = 1 mois.

Principe : la vitesse modifie la granularité des décisions, l’intensité/variance des événements, et la rapidité d’apparition des effets retard.

### 6.7 Boucle de jeu (par tour)

- Lecture : dashboards (P&L, indices, RH, portefeuille, sinistres, solvabilité, parts de marché).
- News Flash / événements : chocs externes + réactions du marché.
- Décisions du joueur : allocation budgétaire + choix stratégiques.
- Résolution : calcul du moteur + feedback (alertes, variations d’indices, impacts P&L, contraintes).
- Debrief court : “ce qui vient de se passer” + “ce que ça implique plus tard”.

---

## 7) Leviers actionnables (décisions)

Le joueur arbitre un budget par tour (et parfois des décisions structurelles). Les leviers sont :

- **Disponibles selon la difficulté** (gating) : Novice < Intermédiaire < Expert.
- **Persistants** : une décision laisse une “empreinte” sur plusieurs tours.
- **Progressifs** pour certains : le levier peut être renforcé par niveaux (N1 → N2 → N3).

### 7.0 Principes transverses (nouveau)

**7.0.1 Persistance relative (inertie + possibilité de compensation)**

- Certaines décisions ont un effet immédiat puis s’atténuent (ex : campagne marketing).
- D’autres créent une inertie (ex : dette IT, climat social, réputation, organisation sinistres).
- Une mauvaise décision peut être **compensée**, mais :
  - le coût de rattrapage augmente avec le temps,
  - certains dommages ont une mémoire partielle (ex : réputation).

**7.0.2 Leviers progressifs (exemple “lutte fraude”)**

- Niveau 1 : quick wins (règles simples, contrôles basiques) → effet rapide mais plafonné.
- Niveau 2 : industrialisation (outillage, formation, process) → effet plus fort avec inertie.
- Niveau 3 : approche data/IA (qualité data, MLOps, gouvernance) → effet maximal, coût élevé, effet retard.

### 7.1 Produit & technique (par produit)

- **Tarification (par produit sélectionné)** : niveau de prime, segmentation tarifaire (ex. profil de risque, zone géographique — selon difficulté), révisions.
- Niveau de franchise : plus/moins protecteur, effet sur attractivité et coût.
- Niveau de couverture : garanties, options, exclusions.

### 7.2 Distribution

- Mix canaux : direct/digital, agents, courtiers, affinitaires, etc.
- Animation & formation des réseaux.
- Commissions versées aux distributeurs (niveau et schémas d’incitation).

### 7.3 Marketing

- Publicité (marque), marketing direct, activation, ciblage.
- Arbitrages CAC (coût d’acquisition) vs valeur long terme.

### 7.4 RH

- Recrutement (sinistres, support, data/IT, distribution, actuariat).
- Rémunération, formation, QVT.
- Gestion des capacités (charge vs capacité) et effets retard.

### 7.5 IT / Data

- Investissements SI (stabilité, scalabilité, sécurité).
- Data (qualité, gouvernance, outillage), automatisation.
- Mise en place de cas d’usage IA (ex : triage sinistres, fraude) selon maturité.

### 7.6 Prestataires / partenaires (incl. gestion déléguée)

- Niveau de recours (internaliser/externaliser).
- Exigences (SLA, qualité), pénalités/bonus.
- Conditions économiques (coûts unitaires, indexation), capacité.

### 7.7 Gestion des sinistres

- Process & organisation (centralisé/délégué/mix) selon paramétrage.
- Lutte contre la fraude (progressive N1/N2/N3), recours, expertise (évaluation dommage par expert-assesseur).
- Réseaux agréés vs gré à gré ; maîtrise coût vs satisfaction.

### 7.8 Réassurance

- Niveau de protection, choix de traités (paramétrable selon version/difficulté).
- Arbitrage coût de la réassurance vs protection du capital.

### 7.9 Prévention

- Investissements prévention (client, habitat, auto, data-driven prévention).
- Effets retard sur fréquence/sévérité.

### 7.10 Provisions & placements

- Politique de provisionnement (prudente vs agressive) et impacts. *Note pédagogique : en réalité, inclut PSNEM/IBNR (sinistres survenus non déclarés).*
- Stratégie d’allocation financière (prudent vs risqué) sur résultat et résilience.

---

## 8) Moteur de simulation

### 8.1 Philosophie

Le moteur combine plusieurs indices systémiques qui réagissent aux leviers du joueur, aux événements et aux actions des concurrents. Le moteur doit :

- Produire des impacts P&L cohérents.
- Intégrer des effets retard (RH, IT, prévention, réputation).
- Rendre visibles les compromis (une décision “optimise” rarement tout).
- **Gérer un portefeuille 1+ produits** : calculs par produit + agrégation (compagnie) avec contraintes partagées.

### 8.2 Indices

Chaque indice est normalisé (ex : 0–100) et possède des sous-indicateurs.

- Indice Attractivité Commerciale (IAC)
- Indice Performance & Qualité Opérationnelle (IPQO)
- Indice Équilibre RH (IERH)
- Indice Résilience Financière (IRF)
- Indice Maturité Data (IMD)
- Indice de Sincérité (IS) (Boni/Mali)
- Indice Performance P&L (IPP)

### 8.3 Interactions & exemples (règles de design)

- Tarifs bas → IAC ↑ court terme, mais risque IPP ↓ si portefeuille se dégrade.
- Sous-investissement RH → IPQO ↓ avec retard, sinistres coûtent plus (erreurs, délais).
- IT/Data ↑ → IMD ↑ (retard), améliore fraude/triage → IPQO ↑ et IPP ↑.
- Réassurance ↑ → IRF ↑ mais IPP peut ↓ (coût), utile en mode survie.
- Provisions agressives → IPP ↑ court terme mais IS ↓ et IRF ↓ (risque futur).

**Interaction multi-produits (nouveau, exemples)**

- Surcroît d’acquisition Auto → charge sinistres ↑ (avec retard) → IPQO ↓ → satisfaction globale ↓ → rétention MRH ↓.
- Investissement prévention “habitat” → fréquence MRH ↓ (effet retard) → marge MRH ↑ → capacité d’investissement IT ↑ → IMD ↑.

### 8.4 Effets retard (exigence MVP)

- RH : 2 tours (paramétrable selon vitesse).
- IT/Data : 3–6 tours selon l’investissement.
- Prévention : 4–8 tours, effet progressif.
- Réputation/NPS : 1–3 tours.

### 8.5 Événements externes (catalogue)

Le catalogue d’événements est structuré en deux familles :

**A) Événements “marché” (systémiques)**

- Épisodes climatiques (fréquence/sévérité variables) affectant l’ensemble du marché.
- Inflation (coûts réparation, frais, commissions).
- Chocs réglementaires (contraintes de croissance, exigences de conformité).
- Disrupteur (insurtech) : guerre des prix, nouveaux canaux.
- Mutation parc auto (électrification, ADAS, véhicules autonomes) : coûts/pièces, expertise spécialisée nécessaire.

**B) Événements “compagnie” (idiosyncratiques)**

- Cyberattaque / panne SI (capacité opérationnelle dégradée).
- Crise RH (mouvement social, démissions, bad buzz employeur).
- Incident prestataire critique (perte de capacité, non-conformité).
- Litige majeur / sanction ciblée.

Règle de design :

- Les événements compagnie sont attribués selon un mix de **probabilité** et de **vulnérabilités** (ex : maturité SI faible, sous-investissement sécurité).
- Les événements marché s’appliquent à tous, mais l’impact est modulé par la stratégie (ex : réassurance, prévention, organisation sinistres).

---

## 9) Scoring, progression & débrief

### 9.1 Score de partie

Score global = combinaison pondérée des indices + objectifs de scénario.

Pondérations variables selon mode/difficulté (ex : mode survie valorise IRF et IPQO).

### 9.2 Débrief (indispensable B2B)

À la fin (ou à intervalles), produire :

- Analyse des décisions clés et de leurs impacts (immédiats et différés).
- Identification des biais : court-termisme, sur-optimisation d’un levier, négligence d’un risque.
- Recommandations de progression (pistes pour la prochaine partie).
- Export : rapport PDF (MVP+) et/ou rapport web.

---

## 10) Fonctionnalités produit (SaaS)

### 10.1 Expérience joueur

- Choix compagnie parmi 18 (fiches, points forts/faiblesses, “traits”).
- **Choix du scope produits** (selon paramètres de session) : 1+ produits.
- Dashboard principal : indices + P&L + alertes + **batterie d’indicateurs de pilotage** (voir ci-dessous).
- Écran décisions : leviers, budgets, explications d’impact (immédiats + retard).
- Écran marché : parts de marché, prix moyens, comportement concurrents.
- Multijoueur : lobby/session, tour synchronisé, mécanisme de décision (individuel/équipe), classement.

**Dashboard principal — batterie d’indicateurs (nouveau, complément MVP)**

Le cockpit doit afficher, en plus des indices déjà prévus, des indicateurs **par produit** et **agrégés compagnie** :

- **Portefeuille** :
  - Nb de contrats (par produit + total)
  - Primes collectées (par produit + total)
  - Acquisition / résiliation (par produit)
- **Sinistres** :
  - Stock de sinistres (par produit + total)
  - Entrées vs sorties (flux)
  - Délais moyens / backlog (si modélisé)
- **Ressources** :
  - Effectif total + répartition (sinistres / distribution / data-IT / support)
  - Charge vs capacité (si modélisé)
- **Finance (niveau pédagogique)** :
  - P&L synthétique
  - Indicateurs clés de performance proxy (ex : résultat, ratio combiné simplifié = (sinistres+frais)/primes)

> Le niveau de détail est adaptable selon la difficulté : novice = indicateurs macro, expert = plus de décomposition.

### 10.2 Expérience admin (B2B)

- Gestion tenants (entreprises/écoles), rôles, groupes.
- Paramétrage sessions : vitesse, difficulté, durée, scénarios activés.
- **Paramétrage portefeuille produits de la session** : sélection 1+ produits (Auto, MRH, PJ, GAV…), pondérations/scénarios associés.
- Paramétrage contenu : catalogue d’événements, pondérations des indices, réglages “réalisme”.
- Suivi pédagogique : progression, scores, exports.

### 10.3 Rôles & permissions (proposition)

- Super Admin (éditeur)
- Admin Tenant (client)
- Formateur
- Joueur
- Observateur (mode séminaire)
- **Chef d’équipe (option séminaire)** : consolide/vote pour l’équipe, anime la décision.

---

## 11) UX/UI — principes

- Interface type cockpit : lisible en 3 minutes.
- Graphiques recommandés :
  - Radar des indices (7 axes)
  - Séries temporelles (indices, P&L)
  - Heatmap événements
- Système d’alertes : goulots RH, solvabilité, dérive sinistres, dette IT.
- “Explainability” : infobulles “pourquoi ça bouge” + historique des décisions.

Ajout :

- **Vue portefeuille multi-produits** (onglets ou grille) : indicateurs par produit + total.
- **Lisibilité séminaire** : un mode “projection” (grand écran) avec hiérarchie visuelle renforcée.

---

## 12) Données & instrumentation

Journaliser : décisions, événements, états des indices, P&L, interactions UI.

- KPI produit : taux de complétion, nb de sessions/utilisateur, rétention, temps/tour.
- KPI pédagogiques : progression par compétence, réduction des biais (IS).
- KPI séminaire : nb participants/observateurs, taux de participation aux votes, temps de décision, distribution des propositions.

---

## 13) Non-fonctionnel & conformité

- Multi-tenant, isolation stricte.
- Sécurité : authentification, RBAC, journal d’audit.
- RGPD : minimisation données personnelles, suppression/export.
- Performance : support multi-joueurs (latence faible), calcul moteur stable.
- Disponibilité : objectifs de SLA à définir selon offres.

Exigence complémentaire :

- Mode séminaire : support du **scaling participants** via rôle Observateur + mécanismes d’équipes, sans dépendre d’un plafond fonctionnel.

---

## 14) MVP — périmètre recommandé

### 14.1 MVP (valeur cœur)

- Solo (IA) + vitesse “Moyenne” (trimestre) + 2 niveaux (Novice/Intermédiaire).
- 18 compagnies jouables (traits simples).
- 7 indices + P&L + 20–30 événements.
- Leviers (version simplifiée) : tarification, offre, distribution/commissions, marketing, RH, sinistres/fraude (au moins N1), réassurance, provisions/placements, IT/data, prévention.
- Debrief de fin de partie (web) + export PDF simple.

**MVP — intégration des ajouts (cadrage)**

- Portefeuille produits : **sélection 1+ produits** disponible dès MVP.
  - Recommandation MVP : démarrer avec **Auto + MRH** (pleinement jouables), et fournir un squelette extensible pour PJ/GAV (affichage + règles simplifiées) si nécessaire.
- Dashboard : ajout des indicateurs de pilotage essentiels (contrats, primes, effectifs, stock sinistres) **au moins pour Auto/MRH**.
- Difficulté = surface de décision : Novice = moins de granularité, Intermédiaire = plus de leviers.
- Événements : inclure au moins 2 événements “compagnie” (cyber/panne SI) + événements “marché” (climat, inflation, réglementation).

### 14.2 V1+ (après MVP)

- Multijoueur.
- Modes Expert & Survie.
- Vitesse Rapide et Lente.
- Admin avancé (paramétrage fin, scénarios, pondérations).
- Personnalisation B2B (branding, catalogue d’événements par client).
- **Extension portefeuille produits** : PJ, GAV (et autres) avec modèles dédiés.
- **Leviers progressifs complets** (fraude N1/N2/N3, maturité data, prévention multi-niveaux).
- **Mode séminaire enrichi** : vote, outils facilitation, export de synthèse groupe.

---

## 15) Hypothèses & risques

- Réalisme vs jouabilité : risque de modèle trop complexe.
- Explainability : si l’utilisateur ne comprend pas, la valeur pédagogique chute.
- Multijoueur/séminaire : complexité technique + besoin de modération.
- Données sensibles : attention à ne pas faire croire à des modèles “prédictifs réels”.
- Multi-produits : explosion combinatoire (règles, indicateurs, calibrage) → nécessite un design modulaire.

---

## 16) Hors périmètre (pour cadrer)

- Reproduction exacte de comptes réels / données clients.
- Modèle actuariel exhaustif (objectif : pédagogique et systémique).
- Connecteurs SI (S2P/ERP) dans les premières versions.

---

## Annexes — Glossaire rapide

- P&L : compte de résultat.
- IARD : Incendie, Accidents et Risques Divers.
- Indice : score normalisé représentant un état systémique.

